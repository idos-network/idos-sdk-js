import { encode as hexEncode } from "@stablelib/hex";
import { hash as sha256Hash } from "@stablelib/sha256";

export { decode as base64Decode } from "@stablelib/base64";
export { encode as base64Encode } from "@stablelib/base64";
export { writeUint16BE as binaryWriteUint16BE } from "@stablelib/binary";
export { concat as bytesConcat } from "@stablelib/bytes";
export { decode as hexDecode } from "@stablelib/hex";

export { decode as utf8Decode } from "@stablelib/utf8";
export { encode as utf8Encode } from "@stablelib/utf8";
export { serialize as borshSerialize } from "borsh";

export { hexEncode, sha256Hash };

export function hexEncodeSha256Hash(data: Uint8Array): string {
  return hexEncode(sha256Hash(data), true);
}
