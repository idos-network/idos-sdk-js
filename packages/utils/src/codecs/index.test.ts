import { describe, expect, it } from "vitest";
import {
  base64Codec,
  bs58Decode,
  bs58Encode,
  fromBytesToJson,
  hexEncodeSha256Hash,
  toBytes,
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

  it("fromBytesToJson throws on invalid JSON", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd]);
    expect(() => fromBytesToJson(bytes)).toThrow();
  });
});
