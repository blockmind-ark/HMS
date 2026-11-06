import crypto from "crypto";

/**
 * Enterprise-grade AES-256-GCM encryption for persisted biometric templates.
 * Protects biometric templates at rest. Never exposes raw templates or keys.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getBiometricEncryptionKey(): Buffer {
  const envKey = process.env.BIOMETRIC_ENCRYPTION_KEY;
  if (envKey) {
    if (envKey.length === 64) {
      // Hex string of 32 bytes
      return Buffer.from(envKey, "hex");
    }
    // Derive a 32-byte key using SHA-256
    return crypto.createHash("sha256").update(envKey).digest();
  }

  // Fallback to derive securely from NEXTAUTH_SECRET with a domain separation salt
  const secret = process.env.NEXTAUTH_SECRET || "Ruqayya-hms-biometric-secret-salt-2026";
  return crypto.pbkdf2Sync(secret, "biometric-template-encryption-salt", 100000, 32, "sha256");
}

export interface EncryptedPayload {
  iv: string; // Base64
  authTag: string; // Base64
  ciphertext: string; // Base64
}

/**
 * Encrypt a plaintext biometric minutiae template string
 */
export function encryptBiometricTemplate(plaintextTemplate: string): string {
  const key = getBiometricEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintextTemplate, "utf8")),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };

  // Pack into a serialized transport format
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decrypt an encrypted biometric template back to its minutiae representation
 */
export function decryptBiometricTemplate(encryptedString: string): string {
  try {
    const key = getBiometricEncryptionKey();
    const rawJSON = Buffer.from(encryptedString, "base64").toString("utf8");
    const payload: EncryptedPayload = JSON.parse(rawJSON);

    const iv = Buffer.from(payload.iv, "base64");
    const authTag = Buffer.from(payload.authTag, "base64");
    const ciphertext = Buffer.from(payload.ciphertext, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err: any) {
    throw new Error("Biometric template decryption failed: cryptographic integrity check error");
  }
}
