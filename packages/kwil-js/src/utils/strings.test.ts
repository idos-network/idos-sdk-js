import { describe, expect, it } from "vitest";

import { strings } from "./strings";

describe("requireNonNilElse", () => {
  it("returns the result of a function default", () => {
    expect(strings.requireNonNilElse(undefined, () => "fallback")).toBe("fallback");
  });
});
