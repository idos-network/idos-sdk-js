import { decode as base64Decode, encode as base64Encode } from "@stablelib/base64";
import nacl from "tweetnacl";

export interface EncryptionCodec {
  encode(data: Uint8Array, userKey: Uint8Array): string;
  decode(encoded: string, userKey: Uint8Array): Uint8Array;
}

/**
 * Creates an encryption key directly from user ID
 */
export function createUserEncryptionKey(userId: string): Uint8Array {
  // Convert user ID to bytes and pad/truncate to 32 bytes for NaCl
  const encoder = new TextEncoder();
  const userIdBytes = encoder.encode(userId);

  // Create a 32-byte key from user ID
  const key = new Uint8Array(32);

  // If user ID is shorter than 32 bytes, repeat it
  for (let i = 0; i < 32; i++) {
    key[i] = userIdBytes[i % userIdBytes.length];
  }

  return key;
}

/**
 * Encryption codec that encrypts data with user-specific keys
 */
export class UserEncryptionCodec implements EncryptionCodec {
  private keyPair: nacl.BoxKeyPair;

  constructor(userEncryptionKey: Uint8Array) {
    // Derive a key pair from the user key for encryption
    this.keyPair = nacl.box.keyPair.fromSecretKey(userEncryptionKey.slice(0, 32));
  }

  static createUserEncryptionCodec(userId: string): UserEncryptionCodec {
    const userEncryptionKey = createUserEncryptionKey(userId);
    return new UserEncryptionCodec(userEncryptionKey);
  }

  encode(data: Uint8Array): string {
    try {
      // Generate ephemeral key pair for this encryption
      const ephemeralKeyPair = nacl.box.keyPair();

      // Encrypt data using our key pair and ephemeral public key
      const nonce = nacl.randomBytes(24);
      const encrypted = nacl.box(data, nonce, ephemeralKeyPair.publicKey, this.keyPair.secretKey);

      if (!encrypted) {
        throw new Error("Encryption failed");
      }

      // Package: ephemeral public key + nonce + encrypted data
      const package_ = new Uint8Array(32 + 24 + encrypted.length);
      package_.set(ephemeralKeyPair.publicKey, 0);
      package_.set(nonce, 32);
      package_.set(encrypted, 56);

      return base64Encode(package_);
    } catch (error) {
      throw new Error(`Failed to encrypt data: ${error}`);
    }
  }

  decode(encoded: string): Uint8Array {
    try {
      const package_ = base64Decode(encoded);

      if (package_.length < 56) {
        throw new Error("Invalid encrypted data format");
      }

      // Extract components
      const ephemeralPublicKey = package_.slice(0, 32);
      const nonce = package_.slice(32, 56);
      const encrypted = package_.slice(56);

      // Decrypt using our secret key and ephemeral public key
      const decrypted = nacl.box.open(encrypted, nonce, ephemeralPublicKey, this.keyPair.secretKey);

      if (!decrypted) {
        throw new Error("Decryption failed - invalid key or corrupted data");
      }

      return decrypted;
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${error}`);
    }
  }
}
