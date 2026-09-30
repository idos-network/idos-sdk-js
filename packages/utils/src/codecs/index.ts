import {
  decode as base64Decode,
  decodeURLSafe,
  encode as base64Encode,
  encodeURLSafe,
} from "@stablelib/base64";
import { encode as hexEncode } from "@stablelib/hex";
import { hash as sha256Hash } from "@stablelib/sha256";
import { decode as utf8Decode, encode as utf8Encode } from "@stablelib/utf8";
import bs58 from "bs58";

import type { PipeCodecArgs } from "../store/interface";

export { base64Decode, base64Encode };
export { writeUint16BE as binaryWriteUint16BE } from "@stablelib/binary";
export { concat as bytesConcat } from "@stablelib/bytes";
export { decode as hexDecode } from "@stablelib/hex";
export { decode as utf8Decode, encode as utf8Encode } from "@stablelib/utf8";
export { deserialize as borshDeserialize, serialize as borshSerialize } from "borsh";
export { hexEncode, sha256Hash };

export function hexEncodeSha256Hash(data: Uint8Array): string {
  return hexEncode(sha256Hash(data), true);
}

// Adobe ascii85 (`<~...~>`, `z` for zero groups).
export function fileToBase85(file: Buffer): string {
  const n = file.length;
  const out = new Uint8Array(4 + Math.ceil(n / 4) * 5);
  out.set([0x3c, 0x7e]); // <~
  let o = 2;

  for (let i = 0; i < n; i += 4) {
    const left = n - i;
    let num =
      ((file[i] << 24) |
        ((left > 1 ? file[i + 1] : 0) << 16) |
        ((left > 2 ? file[i + 2] : 0) << 8) |
        (left > 3 ? file[i + 3] : 0)) >>>
      0;

    if (num === 0 && left >= 4) {
      out[o++] = 0x7a; // z
      continue;
    }

    for (let j = 4; j >= 0; j--) {
      out[o + j] = (num % 85) + 33;
      num = Math.floor(num / 85);
    }
    o += left >= 4 ? 5 : left + 1;
  }

  out[o++] = 0x7e;
  out[o++] = 0x3e; // ~>
  return new TextDecoder("latin1").decode(out.subarray(0, o));
}

export function base85ToFile(data: string): Buffer | false {
  let start = 0;
  let end = data.length;
  if (data.startsWith("<~")) start = 2;
  if (data.endsWith("~>")) end -= 2;

  let zeros = 0;
  for (let i = data.indexOf("z", start); i !== -1 && i < end; i = data.indexOf("z", i + 1)) zeros++;

  const out = new Uint8Array(Math.ceil((end - start) / 5) * 4 + zeros * 4);
  let o = 0;
  let num = 0;
  let count = 0;

  for (let i = start; i < end; i++) {
    const c = data.charCodeAt(i);
    if (c === 0x20 || (c >= 0x09 && c <= 0x0d)) continue; // whitespace

    if (c === 0x7a /* z */) {
      if (count !== 0) return false;
      o += 4; // already zeroed
      continue;
    }

    if (c < 33 || c > 117) return false;
    num = num * 85 + (c - 33);

    if (++count === 5) {
      if (num > 0xffffffff) return false;
      out[o++] = num >>> 24;
      out[o++] = num >>> 16;
      out[o++] = num >>> 8;
      out[o++] = num;
      num = 0;
      count = 0;
    }
  }

  if (count === 1) return false;
  if (count > 1) {
    for (let j = count; j < 5; j++) num = num * 85 + 84; // pad with `u`
    if (num > 0xffffffff) return false;
    for (let j = 0; j < count - 1; j++) out[o++] = num >>> (24 - j * 8);
  }

  return Buffer.from(out.buffer, 0, o);
}

export function bs58Encode(data: Uint8Array): string {
  return bs58.encode(data);
}

export function bs58Decode(data: string): Uint8Array {
  return bs58.decode(data);
}

export function base64UrlEncode(data: Uint8Array): string {
  return encodeURLSafe(data).replace(/=+$/, "");
}

export function base64UrlDecode(data: string): Uint8Array {
  return decodeURLSafe(data);
}

export function toBytes(obj: Parameters<typeof JSON.stringify>[0]): Uint8Array {
  return utf8Encode(JSON.stringify(obj));
}

// oxlint-disable-next-line typescript/no-explicit-any -- any is fine here
export function fromBytesToJson<K = Record<string, any>>(data: Uint8Array): K {
  return JSON.parse(utf8Decode(data));
}

// Codecs for store pipeline
export const base64Codec: PipeCodecArgs<Uint8Array<ArrayBufferLike>> = {
  encode: base64Encode,
  decode: base64Decode,
};
