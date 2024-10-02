import { describe, expect, it } from "vitest";
import { idOSIssuer } from "./index";

describe("idOS Issuer SDK", () => {
  it("should initialise properly", () => {
    const instance = new idOSIssuer();
    expect(instance).toBeDefined();
  });
});
