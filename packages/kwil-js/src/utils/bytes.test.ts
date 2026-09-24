import { describe, expect, it } from "vitest";

import { numberToUint64LittleEndian } from "./bytes";

describe("numberToUint64LittleEndian", () => {
  it.each([
    [0, [0, 0, 0, 0, 0, 0, 0, 0]],
    [1, [1, 0, 0, 0, 0, 0, 0, 0]],
    [255, [255, 0, 0, 0, 0, 0, 0, 0]],
    [4294967296, [0, 0, 0, 0, 1, 0, 0, 0]], // 2^32, i.e. straddles the 32-bit halves
    [1099511627776, [0, 0, 0, 0, 0, 1, 0, 0]], // 2^40
  ])("encodes %i", (num, expected) => {
    expect([...numberToUint64LittleEndian(num)]).toEqual(expected);
  });

  it("truncates a non-integer, like the previous Long-based implementation did", () => {
    expect([...numberToUint64LittleEndian(1.9)]).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("wraps a negative number to its two's complement", () => {
    expect([...numberToUint64LittleEndian(-1)]).toEqual([255, 255, 255, 255, 255, 255, 255, 255]);
  });
});
