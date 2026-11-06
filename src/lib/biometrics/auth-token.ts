import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "hospital-management-system-super-secret-key-2026";

/**
 * Creates a short-lived, tamper-proof HMAC-SHA256 biometric login token (valid for 60 seconds)
 */
export function createBiometricLoginToken(userId: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`${userId}:${timestamp}`)
    .digest("hex");
  return `${userId}:${timestamp}:${signature}`;
}

/**
 * Validates a biometric login token and ensures it has not expired
 */
export function verifyBiometricLoginToken(token: string): { valid: boolean; userId?: string } {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return { valid: false };
    const [userId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Math.abs(Date.now() - timestamp) > 60000) {
      return { valid: false };
    }

    const expectedSig = crypto
      .createHmac("sha256", SECRET)
      .update(`${userId}:${timestampStr}`)
      .digest("hex");

    if (signature.length !== expectedSig.length) return { valid: false };

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSig, "hex")
    );

    return { valid: isValid, userId: isValid ? userId : undefined };
  } catch (e) {
    return { valid: false };
  }
}

