import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  base64Codec,
  base64UrlDecode,
  base64UrlEncode,
  bs58Decode,
  bs58Encode,
  fromBytesToJson,
  hexEncodeSha256Hash,
  toBytes,
  fileToBase85,
  base85ToFile,
} from "./index.js";

describe("codecs", () => {
  it("hexEncodeSha256Hash returns stable hex for known input", () => {
    const bytes = new TextEncoder().encode("abc");
    expect(hexEncodeSha256Hash(bytes)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("toBytes and fromBytesToJson roundtrip", () => {
    const payload = { nested: { value: 42 }, items: ["a", "b"] };
    const bytes = toBytes(payload);
    expect(fromBytesToJson<typeof payload>(bytes)).toEqual(payload);
  });

  it("bs58Encode and bs58Decode roundtrip", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 255]);
    const encoded = bs58Encode(bytes);
    expect(bs58Decode(encoded)).toEqual(bytes);
  });

  it("base64Codec roundtrips", () => {
    const bytes = new Uint8Array([9, 8, 7, 6, 5]);
    const encoded = base64Codec.encode(bytes);
    expect(base64Codec.decode(encoded)).toEqual(bytes);
  });

  it("base64UrlEncode returns unpadded URL-safe base64", () => {
    const bytes = new Uint8Array([251, 255, 255]);
    expect(base64UrlEncode(bytes)).toBe("-___");
  });

  it("base64UrlDecode handles unpadded base64url strings", () => {
    const bytes = new Uint8Array(Array.from({ length: 32 }, (_, index) => index));
    const encoded = base64UrlEncode(bytes);

    expect(encoded).not.toContain("=");
    expect(base64UrlDecode(encoded)).toEqual(bytes);
  });

  it("fromBytesToJson throws on invalid JSON", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);
    expect(() => fromBytesToJson(bytes)).toThrow();
  });

  it("round-trips files (image) through base85", () => {
    const image = readFileSync(path.join(__dirname, "test", "image.png"));

    const serialized = fileToBase85(image);
    const deserialized = base85ToFile(serialized);

    expect(deserialized).not.toBeFalsy();
    expect(deserialized).toStrictEqual(image);
  });

  it("round-trips files (pdf) through base85", () => {
    const document = readFileSync(path.join(__dirname, "test", "document.pdf"));

    const serialized = fileToBase85(document);
    const deserialized = base85ToFile(serialized);

    expect(deserialized).not.toBeFalsy();
    expect(deserialized).toStrictEqual(document);
  });

  it("round-trips files (webp) through base85", () => {
    const image = readFileSync(path.join(__dirname, "test", "image.webp"));

    const serialized = fileToBase85(image);
    const deserialized = base85ToFile(serialized);

    expect(deserialized).not.toBeFalsy();
    expect(deserialized).toStrictEqual(image);
  });
});
