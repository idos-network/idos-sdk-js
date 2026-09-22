import Long from "long";

import { base64ToBytes, bytesToBase64 } from "./base64";
import { objects } from "./objects";
import { strings } from "./strings";
import { HexString } from "./types";

// converts string to bytes using utf-8 encoding
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function stringToEthHex(str: string): HexString {
  let hex = "0x";
  hex += stringToHex(str);
  return hex;
}

export function stringToHex(str: string): HexString {
  return stringToBytes(str).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

export function hexToString(hex: HexString): string {
  strings.requireNonNil(hex);
  return bytesToString(hexToBytes(hex));
}

export function numberToBytes(num: number | bigint): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  if (typeof num === "number") {
    if (num < 0 || num > 9007199254740991) {
      // 2^53 - 1
      throw new Error("Number out of bounds for safe integer representation");
    }
    const high = Math.floor(num / 4294967296); // 2^32
    const low = num % 4294967296;
    view.setUint32(0, high); // High 32 bits
    view.setUint32(4, low); // Low 32 bits
  } else if (typeof num === "bigint") {
    if (num < 0n || num > 0xffffffffffffffffn) {
      throw new Error("Number out of bounds for Uint64 representation");
    }
    const high = Number(num >> 32n);
    const low = Number(num & 0xffffffffn);
    view.setUint32(0, high);
    view.setUint32(4, low);
  } else {
    throw new Error("Unsupported type for conversion to bytes");
  }

  return new Uint8Array(buffer);
}

export function numberToEthHex(num: number): HexString {
  return "0x" + numberToHex(num);
}

export function numberToHex(num: number): HexString {
  let hex = num.toString(16);
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }
  return hex;
}

export function hexToNumber(hex: HexString): number {
  strings.requireNonNil(hex);
  if (hex.length % 2 !== 0) {
    throw new Error(`invalid hex string: ${hex}`);
  }
  // strip 0x prefix
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }
  return parseInt(hex, 16);
}

export function bytesToEthHex(bytes: Uint8Array): HexString {
  return "0x" + bytesToHex(bytes);
}

export function bytesToHex(bytes: Uint8Array): HexString {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

export function hexToBytes(hex: string): Uint8Array {
  strings.requireNonNil(hex);
  if (hex.length % 2 !== 0) {
    throw new Error(`invalid hex string: ${hex}`);
  }

  // strip 0x prefix
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function isHexTxHash(value: string): boolean {
  const hex = value.startsWith("0x") || value.startsWith("0X") ? value.slice(2) : value;
  return hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex);
}

export function base64ToHex(base64: string): HexString {
  if (isHexTxHash(base64)) {
    return base64.startsWith("0x") || base64.startsWith("0X") ? base64.slice(2) : base64;
  }
  return bytesToHex(base64ToBytes(base64));
}

export function hexToBase64(hex: HexString): string {
  return bytesToBase64(hexToBytes(hex));
}

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function int32ToBytes(num: number): Uint8Array {
  objects.requireNonNilNumber(num);
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, num, true);
  return new Uint8Array(buffer);
}

export function bytesToInt32(bytes: Uint8Array): number {
  objects.requireNonNil(bytes);
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  for (let i = 0; i < bytes.length; i++) {
    view.setInt8(i, bytes[i]);
  }
  return view.getInt32(0, true);
}

export function int64ToBytes(num: number): Uint8Array {
  objects.requireNonNilNumber(num);
  const longNum = Long.fromNumber(num, true);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setInt32(0, longNum.low, true);
  view.setInt32(4, longNum.high, true);
  return new Uint8Array(buffer);
}

export function bytesToInt64(bytes: Uint8Array): number {
  objects.requireNonNil(bytes);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0; i < bytes.length; i++) {
    view.setInt8(i, bytes[i]);
  }
  return view.getInt32(0, true);
}

export function booleanToBytes(bool: boolean): Uint8Array {
  objects.requireNonNil(bool);
  const buffer = new ArrayBuffer(1);
  const view = new DataView(buffer);
  view.setUint8(0, bool ? 1 : 0);
  return new Uint8Array(buffer);
}

export function bytesToBoolean(bytes: Uint8Array): boolean {
  objects.requireNonNil(bytes);
  const buffer = new ArrayBuffer(1);
  const view = new DataView(buffer);
  for (let i = 0; i < bytes.length; i++) {
    view.setUint8(i, bytes[i]);
  }
  return view.getUint8(0) === 1;
}
