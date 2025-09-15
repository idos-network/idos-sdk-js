import { utf8Decode, utf8Encode } from "../codecs";

/**
 * Obfuscates a password using XOR with the user_id as the key.
 * This provides a simple but effective way to hide the password in localStorage
 * while still allowing recovery when the user_id is known.
 */
export function obfuscatePassword(password: string, userId: string): string {
  const passwordBytes = utf8Encode(password);
  const userIdBytes = utf8Encode(userId);

  // Create a repeating key pattern from the userId
  const keyBytes = new Uint8Array(passwordBytes.length);
  for (let i = 0; i < passwordBytes.length; i++) {
    keyBytes[i] = userIdBytes[i % userIdBytes.length];
  }

  // XOR the password with the key
  const obfuscatedBytes = new Uint8Array(passwordBytes.length);
  for (let i = 0; i < passwordBytes.length; i++) {
    obfuscatedBytes[i] = passwordBytes[i] ^ keyBytes[i];
  }

  // Encode as base64 for storage
  return btoa(String.fromCharCode(...obfuscatedBytes));
}

/**
 * Deobfuscates a password that was obfuscated using XOR with the user_id.
 */
export function deobfuscatePassword(obfuscatedPassword: string, userId: string): string {
  try {
    // Decode from base64
    const obfuscatedBytes = new Uint8Array(
      atob(obfuscatedPassword)
        .split("")
        .map((char) => char.charCodeAt(0)),
    );

    const userIdBytes = utf8Encode(userId);

    // Create the same repeating key pattern
    const keyBytes = new Uint8Array(obfuscatedBytes.length);
    for (let i = 0; i < obfuscatedBytes.length; i++) {
      keyBytes[i] = userIdBytes[i % userIdBytes.length];
    }

    // XOR again to recover the original password
    const passwordBytes = new Uint8Array(obfuscatedBytes.length);
    for (let i = 0; i < obfuscatedBytes.length; i++) {
      passwordBytes[i] = obfuscatedBytes[i] ^ keyBytes[i];
    }

    return utf8Decode(passwordBytes);
  } catch (error) {
    throw new Error(
      `Failed to deobfuscate password: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
