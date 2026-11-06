import crypto from "crypto";
import {
  IBiometricScannerAdapter,
  ScannerDeviceInfo,
  BiometricCaptureResult,
  BiometricMatchResult,
  CandidateTemplate,
  FingerPosition,
} from "./types";

/**
 * Minutiae Point structure representing extracted fingerprint features
 * based on standard ISO/IEC 19794-2 / ANSI 378 minutiae representations.
 */
interface MinutiaePoint {
  x: number; // Coordinate (0 - 500)
  y: number; // Coordinate (0 - 500)
  theta: number; // Angle in degrees (0 - 360)
  type: "ENDING" | "BIFURCATION";
}

interface ParsedTemplate {
  format: "ISO_19794_2_SIMULATED" | "VENDOR_SDK";
  fingerPosition: FingerPosition;
  quality: number;
  minutiae: MinutiaePoint[];
}

/**
 * Real Minutiae Matching Engine
 * Compares two sets of minutiae points using spatial proximity and angular tolerance.
 * NEVER compares hashes. Computes a similarity score between 0 and 100.
 */
export function compareMinutiaeTemplates(
  probeTemplateStr: string,
  candidateTemplateStr: string
): { score: number; matchedPoints: number; totalProbePoints: number } {
  try {
    const probe: ParsedTemplate = JSON.parse(probeTemplateStr);
    const candidate: ParsedTemplate = JSON.parse(candidateTemplateStr);

    if (!probe.minutiae || !candidate.minutiae || probe.minutiae.length === 0) {
      return { score: 0, matchedPoints: 0, totalProbePoints: 0 };
    }

    const DISTANCE_THRESHOLD = 25; // pixels
    const ANGLE_THRESHOLD = 30; // degrees

    let matchedPoints = 0;
    const candidateUsed = new Set<number>();

    for (const pPoint of probe.minutiae) {
      let bestDist = Infinity;
      let bestIndex = -1;

      for (let i = 0; i < candidate.minutiae.length; i++) {
        if (candidateUsed.has(i)) continue;
        const cPoint = candidate.minutiae[i];

        if (pPoint.type !== cPoint.type) continue;

        const dx = pPoint.x - cPoint.x;
        const dy = pPoint.y - cPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= DISTANCE_THRESHOLD) {
          let dAngle = Math.abs(pPoint.theta - cPoint.theta);
          if (dAngle > 180) dAngle = 360 - dAngle;

          if (dAngle <= ANGLE_THRESHOLD && dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
          }
        }
      }

      if (bestIndex !== -1) {
        matchedPoints++;
        candidateUsed.add(bestIndex);
      }
    }

    // Normalized matching score (Bozorth3-style minutiae pairing score)
    const totalPoints = Math.min(probe.minutiae.length, candidate.minutiae.length);
    const score = totalPoints > 0 ? (matchedPoints / totalPoints) * 100 : 0;

    return {
      score: Math.min(100, Math.round(score * 10) / 10),
      matchedPoints,
      totalProbePoints: probe.minutiae.length,
    };
  } catch (e) {
    // If template format cannot be parsed
    return { score: 0, matchedPoints: 0, totalProbePoints: 0 };
  }
}

/**
 * Generate synthetic minutiae template with consistent features for mock testing
 */
function generateSyntheticMinutiae(seedKey: string, finger: FingerPosition, quality: number = 92): string {
  // Deterministic seed based on key
  const hash = crypto.createHash("sha256").update(seedKey).digest("hex");
  const minutiae: MinutiaePoint[] = [];

  // Generate 24 standard minutiae features
  for (let i = 0; i < 24; i++) {
    const chunk = hash.slice((i * 2) % (hash.length - 8), (i * 2) % (hash.length - 8) + 8);
    const num = parseInt(chunk, 16);

    const x = 50 + (num % 400);
    const y = 50 + ((num >> 8) % 400);
    const theta = (num >> 16) % 360;
    const type = (num % 2 === 0) ? "ENDING" : "BIFURCATION";

    minutiae.push({ x, y, theta, type });
  }

  const template: ParsedTemplate = {
    format: "ISO_19794_2_SIMULATED",
    fingerPosition: finger,
    quality,
    minutiae,
  };

  return JSON.stringify(template);
}

/**
 * Development-Only Mock Scanner Adapter
 * Clearly labeled as mock. Emulates hardware scanner without claiming real hardware is attached.
 */
export class MockDevelopmentScannerAdapter implements IBiometricScannerAdapter {
  readonly adapterName = "Mock Development Adapter (Simulated Engine)";
  readonly isMock = true;

  // Allows testing error states in dev
  public simulatedState: "READY" | "DISCONNECTED" | "LOW_QUALITY" = "READY";
  public simulatedProbeSeed: string | null = null;

  async getDeviceInfo(): Promise<ScannerDeviceInfo> {
    return {
      model: "Mock Dev Biometric Engine v1.0",
      vendor: "Ruqayya Clinic Engineering (Mock / Development)",
      serialNumber: "DEV-MOCK-9999",
      driverVersion: "1.0.0-mock",
      isMock: true,
      adapterName: this.adapterName,
      status: this.simulatedState === "DISCONNECTED" ? "DISCONNECTED" : "READY",
      capabilities: {
        canCapture: true,
        canExtractMinutiae: true,
        supports1toN: true,
        maxTemplateCapacity: 5000,
      },
    };
  }

  async captureFingerprint(
    purpose: "ENROLLMENT" | "VERIFICATION",
    options?: { device?: string; isMock?: boolean; timeoutMs?: number }
  ): Promise<BiometricCaptureResult> {
    if (this.simulatedState === "DISCONNECTED") {
      return {
        success: false,
        error: "Biometric optical scanner is disconnected or USB bus unresponsive.",
        errorCode: "DISCONNECTED",
      };
    }

    if (this.simulatedState === "LOW_QUALITY") {
      return {
        success: false,
        error: "Poor image quality. Minutiae count below 15 points. Please clean scanner glass.",
        errorCode: "LOW_QUALITY",
        qualityScore: 32,
      };
    }

    // Generate valid minutiae template
    const seed = this.simulatedProbeSeed || `capture-sample-${Date.now()}-${Math.random()}`;
    const template = generateSyntheticMinutiae(seed, "RIGHT_INDEX", 94);
    const hashSeed = crypto.createHash("sha256").update(template).digest("hex").slice(0, 16).toUpperCase();
    const biometricHash = `FP-SIM-${hashSeed}-RIGHTINDEX`;

    return {
      success: true,
      template,
      biometricHash,
      qualityScore: 94,
      imageWidth: 500,
      imageHeight: 500,
    };
  }

  async match1toN(probeTemplate: string, candidates: CandidateTemplate[]): Promise<BiometricMatchResult> {
    if (candidates.length === 0) {
      return {
        success: true,
        matchFound: false,
        confidenceScore: 0,
        status: "NO_MATCH",
      };
    }

    const MATCH_THRESHOLD = 70.0;
    const AMBIGUITY_DELTA = 5.0;

    interface ScoredCandidate {
      candidate: CandidateTemplate;
      score: number;
      matchedPoints: number;
    }

    const scores: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      const { score, matchedPoints } = compareMinutiaeTemplates(probeTemplate, candidate.template);
      scores.push({ candidate, score, matchedPoints });
    }

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    const top = scores[0];

    // Check if score meets threshold
    if (!top || top.score < MATCH_THRESHOLD) {
      return {
        success: true,
        matchFound: false,
        confidenceScore: top ? top.score : 0,
        status: "NO_MATCH",
        candidateMatchesCount: 0,
      };
    }

    // Check for ambiguity (multiple matches with very close scores)
    const qualifying = scores.filter((s) => s.score >= MATCH_THRESHOLD);
    if (qualifying.length > 1) {
      const secondTop = qualifying[1];
      if (top.score - secondTop.score < AMBIGUITY_DELTA) {
        return {
          success: true,
          matchFound: false,
          confidenceScore: top.score,
          status: "UNCERTAIN_MULTIPLE_MATCHES",
          candidateMatchesCount: qualifying.length,
          error: "Biometric ambiguity: Minutiae matches multiple users closely. Manual identification required.",
        };
      }
    }

    return {
      success: true,
      matchFound: true,
      matchedUserId: top.candidate.userId,
      matchedEnrollmentId: top.candidate.id,
      fingerPosition: top.candidate.fingerPosition,
      confidenceScore: top.score,
      status: "MATCH_FOUND",
      candidateMatchesCount: 1,
    };
  }
}

/**
 * Production Local Scanner Service Adapter
 * Communicates with a vendor-supported local daemon/agent on localhost with authenticated pairing,
 * short-lived timestamps, and origin restrictions.
 */
export class LocalServiceScannerAdapter implements IBiometricScannerAdapter {
  readonly adapterName = "Local Vendor Scanner Agent (Production)";
  readonly isMock = false;

  private serviceUrl: string;
  private pairingSecret: string;

  constructor(serviceUrl?: string, pairingSecret?: string) {
    this.serviceUrl = serviceUrl || process.env.BIOMETRIC_AGENT_URL || "http://127.0.0.1:9099";
    this.pairingSecret = pairingSecret || process.env.BIOMETRIC_AGENT_TOKEN || "Ruqayya-scanner-agent-pairing-token-2026";
  }

  private generateAuthHeaders(): Record<string, string> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString("hex");

    const signature = crypto
      .createHmac("sha256", this.pairingSecret || "Ruqayya-scanner-agent-pairing-token-2026")
      .update(`${timestamp}:${nonce}`)
      .digest("hex");

    return {
      "Content-Type": "application/json",
      "Origin": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Biometric-Timestamp": timestamp,
      "X-Biometric-Nonce": nonce,
      "X-Biometric-Signature": signature,
    };
  }

  async getDeviceInfo(): Promise<ScannerDeviceInfo> {
    try {
      const res = await fetch(`${this.serviceUrl}/api/v1/device`, {
        headers: this.generateAuthHeaders(),
      });

      if (!res.ok) {
        return {
          model: "Vendor Scanner Agent Offline",
          vendor: "Vendor Hardware",
          isMock: false,
          adapterName: this.adapterName,
          status: "DISCONNECTED",
          capabilities: { canCapture: false, canExtractMinutiae: false, supports1toN: false },
        };
      }

      const data = await res.json();
      return {
        model: data.model || "Optical USB Fingerprint Reader",
        vendor: data.vendor || "Hardware Vendor",
        serialNumber: data.serialNumber,
        driverVersion: data.driverVersion,
        isMock: false,
        adapterName: this.adapterName,
        status: data.connected ? "READY" : "DISCONNECTED",
        capabilities: {
          canCapture: true,
          canExtractMinutiae: true,
          supports1toN: !!data.supports1toN,
          maxTemplateCapacity: data.maxTemplateCapacity,
        },
      };
    } catch (err) {
      return {
        model: "Vendor Scanner Service Unreachable",
        vendor: "Local Daemon",
        isMock: false,
        adapterName: this.adapterName,
        status: "DISCONNECTED",
        capabilities: { canCapture: false, canExtractMinutiae: false, supports1toN: false },
      };
    }
  }

  async captureFingerprint(
    purpose: "ENROLLMENT" | "VERIFICATION",
    options?: { device?: string; isMock?: boolean; timeoutMs?: number }
  ): Promise<BiometricCaptureResult> {
    try {
      const res = await fetch(`${this.serviceUrl}/api/v1/capture`, {
        method: "POST",
        headers: this.generateAuthHeaders(),
        body: JSON.stringify({
          purpose,
          timeoutMs: options?.timeoutMs || 30000,
          device: options?.device,
          isMock: options?.isMock,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Scanner capture failed",
          errorCode: data.errorCode || "HARDWARE_ERROR",
        };
      }

      let biometricHash = data.biometricHash;
      if (!biometricHash && data.template) {
        const hashSeed = crypto.createHash("sha256").update(data.template).digest("hex").slice(0, 16).toUpperCase();
        biometricHash = `FP-HW-${hashSeed}-THUMB`;
      }

      return {
        success: true,
        template: data.template,
        biometricHash,
        qualityScore: data.qualityScore || 85,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Could not connect to local vendor scanner service. Ensure daemon is running on port 9099.",
        errorCode: "DISCONNECTED",
      };
    }
  }

  async match1toN(probeTemplate: string, candidates: CandidateTemplate[]): Promise<BiometricMatchResult> {
    try {
      // Delegate 1:N matching to local vendor matching engine
      const res = await fetch(`${this.serviceUrl}/api/v1/match-1-n`, {
        method: "POST",
        headers: this.generateAuthHeaders(),
        body: JSON.stringify({ probeTemplate, candidates }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      // Fallback to internal algorithmic matcher if vendor service does not implement 1:N endpoint
      const mockMatcher = new MockDevelopmentScannerAdapter();
      return mockMatcher.match1toN(probeTemplate, candidates);
    }
  }
}

// Global Singleton Adapter instance
let currentAdapter: IBiometricScannerAdapter | null = null;

export function getBiometricScannerAdapter(): IBiometricScannerAdapter {
  if (currentAdapter) return currentAdapter;

  const adapterType = process.env.BIOMETRIC_ADAPTER_TYPE || "mock";

  if (adapterType === "local_service") {
    currentAdapter = new LocalServiceScannerAdapter();
  } else {
    currentAdapter = new MockDevelopmentScannerAdapter();
  }

  return currentAdapter;
}

export function setBiometricScannerAdapterForTesting(adapter: IBiometricScannerAdapter) {
  currentAdapter = adapter;
}
