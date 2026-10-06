import { describe, expect, it } from "vitest";

import { bytesToHex } from "./serial";
import { convertUuidToBytes, isUuid } from "./uuid";

describe("isUuid", () => {
  it.each([
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // v1
    "9c2b1a4e-3f5d-4a8b-9c7e-1d2f3a4b5c6d", // v4
    "00000000-0000-0000-0000-000000000000", // nil
    "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF", // max, uppercase
  ])("accepts %s", (value) => {
    expect(isUuid(value)).toBe(true);
  });

  it.each([
    "",
    "not-a-uuid",
    "9c2b1a4e3f5d4a8b9c7e1d2f3a4b5c6d", // no dashes
    "9c2b1a4e-3f5d-0a8b-9c7e-1d2f3a4b5c6d", // version 0
    "9c2b1a4e-3f5d-4a8b-0c7e-1d2f3a4b5c6d", // bad variant
    "9c2b1a4e-3f5d-4a8b-9c7e-1d2f3a4b5c6d-extra",
  ])("rejects %s", (value) => {
    expect(isUuid(value)).toBe(false);
  });
});

describe("convertUuidToBytes", () => {
  it("produces the 16 big-endian bytes of the uuid", () => {
    const bytes = convertUuidToBytes("6ba7b810-9dad-11d1-80b4-00c04fd430c8");

    expect(bytes).toHaveLength(16);
    expect(bytesToHex(bytes)).toBe("6ba7b8109dad11d180b400c04fd430c8");
  });
});
