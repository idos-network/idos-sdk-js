import { sha224, sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export function sha224BytesToString(message: Uint8Array): string {
  return bytesToHex(sha224(message));
}

export function sha256BytesToBytes(message: Uint8Array): Uint8Array {
  return sha256(message);
}
