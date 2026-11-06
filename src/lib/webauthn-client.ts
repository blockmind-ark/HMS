/**
 * Client-side WebAuthn utilities for converting ArrayBuffers and Base64URL strings
 * Safe for all browser environments without Node.js dependencies.
 */

export function bufferToBase64URL(buffer: ArrayBuffer | Uint8Array | ArrayBufferView): string {
  const bytes =
    buffer instanceof Uint8Array
      ? buffer
      : "buffer" in buffer && buffer.buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer.buffer)
      : new Uint8Array(buffer as ArrayBuffer);

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64URLToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Check if the browser supports WebAuthn and Platform Biometric authenticators
 */
export async function checkBiometricSupport(): Promise<{
  supported: boolean;
  hasPlatformAuthenticator: boolean;
}> {
  if (
    typeof window === "undefined" ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return { supported: false, hasPlatformAuthenticator: false };
  }

  let hasPlatformAuthenticator = false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
      hasPlatformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (err) {
    console.warn("Could not query platform authenticator:", err);
  }

  return {
    supported: true,
    hasPlatformAuthenticator,
  };
}

