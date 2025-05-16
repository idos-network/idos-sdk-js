import { encode as hexEncode } from "@stablelib/hex";
import { hash as sha256Hash } from "@stablelib/sha256";
import { encode as utf8Encode } from "@stablelib/utf8";
import bs58 from "bs58";

export { decode as base64Decode, encode as base64Encode } from "@stablelib/base64";
export { writeUint16BE as binaryWriteUint16BE } from "@stablelib/binary";
export { concat as bytesConcat } from "@stablelib/bytes";
export { decode as hexDecode } from "@stablelib/hex";
export { decode as utf8Decode, encode as utf8Encode } from "@stablelib/utf8";
export { serialize as borshSerialize } from "borsh";

export { hexEncode, sha256Hash };

export function hexEncodeSha256Hash(data: Uint8Array): string {
  return hexEncode(sha256Hash(data), true);
}

export function bs58Encode(data: Uint8Array): string {
  return bs58.encode(data);
}

export function bs58Decode(data: string): Uint8Array {
  return bs58.decode(data);
}

export function toBytes(obj: Parameters<typeof JSON.stringify>[0]): Uint8Array {
  return utf8Encode(JSON.stringify(obj));
}
