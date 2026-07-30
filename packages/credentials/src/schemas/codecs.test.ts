import { describe, expect, it } from "vitest";
import { z } from "zod";

import { Base85File, IsoDate } from "./codecs";

describe("Base85File", () => {
  it("round-trips a buffer through delimited ascii85", () => {
    const file = Buffer.from("document");
    const encoded = z.encode(Base85File, file);

    expect(encoded).toMatch(/^<~.*~>$/);
    expect(z.decode(Base85File, encoded)).toEqual(file);
  });

  /*
   * `base85.decode` happily returns a buffer for arbitrary input rather than `false`, so
   * without the framing check garbage would silently decode into a credential subject.
   */
  it("rejects a string that is not delimited ascii85", () => {
    expect(() => z.decode(Base85File, "!!!not-base85!!!")).toThrow(z.ZodError);
  });
});

describe("IsoDate", () => {
  it("round-trips a date through ISO 8601", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");

    expect(z.encode(IsoDate, date)).toBe("2024-01-01T00:00:00.000Z");
    expect(z.decode(IsoDate, "2024-01-01T00:00:00.000Z")).toEqual(date);
  });

  it("rejects a string that is not ISO 8601", () => {
    expect(() => z.decode(IsoDate, "01/01/2024")).toThrow(z.ZodError);
  });
});
