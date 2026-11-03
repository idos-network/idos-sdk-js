import { describe, expect, it } from "vitest";

import { claimRows } from "./claims";

describe("claimRows", () => {
  it("labels each claim and its source, in a fixed order", () => {
    const rows = claimRows({
      level: "basic+liveness",
      claims: { email: "MANUAL", identity: "VERIFIED", address: "PROOF_OF_ADDRESS" },
    });

    expect(rows.map(({ label, sourceLabel, variant }) => [label, sourceLabel, variant])).toEqual([
      ["Identity", "Verified", "success"],
      ["Address", "Proof of address", "success"],
      ["Email", "Self-attested", "warning"],
    ]);
  });

  it("derives the claims of a credential issued before claims from its level", () => {
    expect(claimRows({ level: "plus+liveness" }).map((row) => row.claim)).toEqual([
      "identity",
      "liveness",
      "address",
    ]);
  });

  it("shows unknown claims and sources as they are, and skips malformed ones", () => {
    const rows = claimRows({ claims: { futureClaim: "NEW_SOURCE", email: { nested: true } } });

    expect(rows).toEqual([
      {
        claim: "futureClaim",
        label: "futureClaim",
        source: "NEW_SOURCE",
        sourceLabel: "NEW_SOURCE",
        variant: "default",
      },
    ]);
  });

  it("has no claims for public notes without a level or claims", () => {
    expect(claimRows({ type: "pop" })).toEqual([]);
  });
});
