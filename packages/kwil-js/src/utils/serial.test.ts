import { describe, expect, it } from "vitest";

import { bytesToBase64 } from "../utils/base64";
import { base64ToHex, hexToBytes, int64ToBytes, isHexTxHash } from "../utils/serial";

const HEX_TX_HASH = "e3d2bc9e38cc02af7e6babe4094a8a8afcf0074cb93151ca8339770ae554f45d";
const CORRUPTED_96_HEX =
  "7b77766dcf5edfc71cd3669fedee9b69b7b8d3de1af1af1a7dc7f4d3be1c6fddf5e7571af37dfdefbd1a7b9e787f8e5d";

describe("serial tx_hash encoding", () => {
  it("passes through 64-char hex broadcast tx_hash unchanged", () => {
    expect(isHexTxHash(HEX_TX_HASH)).toBe(true);
    expect(base64ToHex(HEX_TX_HASH)).toBe(HEX_TX_HASH);
  });

  it("decodes legacy base64 tx_hash to 64-char hex", () => {
    const legacy = bytesToBase64(hexToBytes(HEX_TX_HASH));
    expect(isHexTxHash(legacy)).toBe(false);
    expect(base64ToHex(legacy)).toBe(HEX_TX_HASH);
  });

  it("does not treat 96-char hex as valid pass-through", () => {
    expect(isHexTxHash(CORRUPTED_96_HEX)).toBe(false);
    expect(base64ToHex(CORRUPTED_96_HEX)).not.toBe(CORRUPTED_96_HEX);
  });
});

describe("int64ToBytes", () => {
  it.each([
    [0, [0, 0, 0, 0, 0, 0, 0, 0]],
    [1, [1, 0, 0, 0, 0, 0, 0, 0]],
    [4294967296, [0, 0, 0, 0, 1, 0, 0, 0]], // 2^32, i.e. straddles the 32-bit halves
    [1099511627776, [0, 0, 0, 0, 0, 1, 0, 0]], // 2^40
    [-1, [255, 255, 255, 255, 255, 255, 255, 255]],
  ])("encodes %i as little-endian int64", (num, expected) => {
    expect([...int64ToBytes(num)]).toEqual(expected);
  });
});
