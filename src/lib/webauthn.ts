import crypto from "crypto";

/**
 * Base64URL encoding and decoding utilities
 */
export function bufferToBase64URL(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64URLToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}

/**
 * Generate a random 32-byte cryptographic challenge
 */
export function generateChallenge(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Format registration options for navigator.credentials.create()
 */
export function createRegistrationOptions(params: {
  challenge: string;
  patientId: string;
  patientUid: string;
  patientName: string;
  rpName?: string;
  rpId?: string;
}) {
  const { challenge, patientId, patientUid, patientName, rpName = "Ruqayya Clinic", rpId } = params;

  // Base64URL encoded user ID
  const userIdBase64 = Buffer.from(patientId).toString("base64url");

  return {
    challenge,
    rp: {
      name: rpName,
      ...(rpId ? { id: rpId } : {}),
    },
    user: {
      id: userIdBase64,
      name: patientUid,
      displayName: patientName,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" }, // ES256 (Common for Windows Hello, Touch ID, Android)
      { alg: -257, type: "public-key" }, // RS256
    ],
    timeout: 60000,
    attestation: "none",
    authenticatorSelection: {
      authenticatorAttachment: undefined, // allow platform (Windows Hello/Touch ID) or cross-platform (USB)
      userVerification: "preferred",
      residentKey: "preferred",
    },
  };
}

/**
 * Format authentication options for navigator.credentials.get()
 */
export function createAuthenticationOptions(params: {
  challenge: string;
  credentialIds?: string[];
  rpId?: string;
}) {
  const { challenge, credentialIds = [], rpId } = params;

  return {
    challenge,
    timeout: 60000,
    ...(rpId ? { rpId } : {}),
    userVerification: "preferred",
    allowCredentials: credentialIds.map((id) => ({
      id,
      type: "public-key",
      transports: ["internal", "usb", "nfc", "ble"],
    })),
  };
}

/**
 * Verify clientDataJSON against expected challenge and type
 */
export function verifyClientData(
  clientDataJSONBase64: string,
  expectedChallenge: string,
  expectedType: "webauthn.create" | "webauthn.get"
): { isValid: boolean; error?: string; origin?: string } {
  try {
    const rawJSON = Buffer.from(base64URLToBuffer(clientDataJSONBase64)).toString("utf8");
    const clientData = JSON.parse(rawJSON);

    if (clientData.type !== expectedType) {
      return { isValid: false, error: `Invalid operation type: expected ${expectedType}, got ${clientData.type}` };
    }

    if (clientData.challenge !== expectedChallenge) {
      return { isValid: false, error: "Challenge mismatch" };
    }

    return { isValid: true, origin: clientData.origin };
  } catch (err: any) {
    return { isValid: false, error: err.message || "Failed to parse clientDataJSON" };
  }
}

