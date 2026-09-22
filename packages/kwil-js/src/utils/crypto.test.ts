import { describe, expect, it } from "vitest";

import { sha224BytesToString, sha256BytesToBytes } from "./crypto";
import { bytesToHex, stringToBytes } from "./serial";

// NIST test vectors — these pin the hashes the Kwil wire format depends on.
describe("sha224BytesToString", () => {
  it("hashes the empty input", () => {
    expect(sha224BytesToString(new Uint8Array())).toBe(
      "d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f",
    );
  });

  it("hashes 'abc'", () => {
    expect(sha224BytesToString(stringToBytes("abc"))).toBe(
      "23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7",
    );
  });
});

describe("sha256BytesToBytes", () => {
  it("hashes the empty input", () => {
    expect(bytesToHex(sha256BytesToBytes(new Uint8Array()))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("hashes 'abc'", () => {
    expect(bytesToHex(sha256BytesToBytes(stringToBytes("abc")))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
