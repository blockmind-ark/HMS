/**
 * Types and Interfaces for Enterprise Biometric Scanner Integration
 */

export type FingerPosition =
  | "RIGHT_INDEX"
  | "RIGHT_THUMB"
  | "RIGHT_MIDDLE"
  | "LEFT_INDEX"
  | "LEFT_THUMB"
  | "LEFT_MIDDLE";

export type ScannerStatus = "READY" | "DISCONNECTED" | "UNSUPPORTED" | "BUSY" | "INITIALIZING";

export type CaptureErrorCode =
  | "LOW_QUALITY"
  | "PARTIAL_CAPTURE"
  | "SENSOR_DIRTY"
  | "TIMEOUT"
  | "DISCONNECTED"
  | "HARDWARE_ERROR"
  | "SDK_NOT_INSTALLED"
  | "PERMISSION_DENIED"
  | "DEVICE_BUSY"
  | "DEVICE_NOT_FOUND"
  | "MALFORMED_REQUEST";

export interface ScannerDeviceInfo {
  model: string;
  vendor: string;
  serialNumber?: string;
  driverVersion?: string;
  isMock: boolean;
  adapterName: string;
  status: ScannerStatus;
  capabilities: {
    canCapture: boolean;
    canExtractMinutiae: boolean;
    supports1toN: boolean;
    maxTemplateCapacity?: number;
  };
}

export interface BiometricCaptureResult {
  success: boolean;
  template?: string; // Standard minutiae template string (Base64)
  biometricHash?: string; // Unique deterministic thumb hash for 1:1 validation
  qualityScore?: number; // 0 - 100
  imageWidth?: number;
  imageHeight?: number;
  error?: string;
  errorCode?: CaptureErrorCode;
}

export interface CandidateTemplate {
  id: string; // Enrollment ID
  userId: string;
  fingerPosition: FingerPosition;
  template: string; // Plaintext minutiae template (after backend decryption)
}

export interface BiometricMatchResult {
  success: boolean;
  matchFound: boolean;
  matchedUserId?: string;
  matchedEnrollmentId?: string;
  fingerPosition?: FingerPosition;
  confidenceScore: number; // 0 - 100
  status: "MATCH_FOUND" | "NO_MATCH" | "UNCERTAIN_MULTIPLE_MATCHES" | "ERROR";
  error?: string;
  candidateMatchesCount?: number;
}

export interface IBiometricScannerAdapter {
  readonly adapterName: string;
  readonly isMock: boolean;

  getDeviceInfo(): Promise<ScannerDeviceInfo>;
  captureFingerprint(
    purpose: "ENROLLMENT" | "VERIFICATION",
    options?: { device?: string; isMock?: boolean; timeoutMs?: number }
  ): Promise<BiometricCaptureResult>;
  match1toN(probeTemplate: string, candidates: CandidateTemplate[]): Promise<BiometricMatchResult>;
}
