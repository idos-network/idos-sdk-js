import { describe, expect, it } from "vitest";
import { createIssuer } from "./index";

describe("idOS Issuer SDK", () => {
  it("should initialise properly", () => {
    const issuer = createIssuer();
    expect(issuer).toBeDefined();
  });
});
