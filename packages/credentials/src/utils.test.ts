import { describe, expect, it } from "vitest";
import { deriveLevel, matchLevelOrHigher, pickHighestMatchingLevel } from "./utils";
import type { CredentialSubject } from "./utils/types";

const defaultCredential: CredentialSubject = {
  id: "uuid:1234",
  firstName: "John",
  familyName: "Doe",
  idDocumentType: "PASSPORT",
  dateOfBirth: new Date("1990-01-01"),
  idDocumentCountry: "US",
  idDocumentNumber: "123456789",
  idDocumentFrontFile: Buffer.from("ID Document Front"),
  selfieFile: Buffer.alloc(0),
};

describe("matchLevelOrHigher", () => {
  [
    ["basic", [], "basic+liveness", true],
    ["plus", [], "plus+liveness", true],
    ["plus", [], "basic", false],
    ["plus", ["liveness"], "plus", false],
    ["basic", ["email"], "basic+liveness+email+phoneNumber", true],
    ["plus", ["email", "phoneNumber"], "plus+liveness+email+phoneNumber", true],
    ["plus", ["email", "phoneNumber"], "plus+phoneNumber", false],
  ].forEach(([level, requiredAddons, testLevel, expected]) => {
    it(`level=${level} requiredAddons=[${(requiredAddons as string[]).join(",")}] testLevel=${testLevel} => ${expected}`, () => {
      expect(
        matchLevelOrHigher(
          level as "basic" | "plus",
          requiredAddons as ("liveness" | "email" | "phoneNumber")[],
          testLevel as string,
        ),
      ).toBe(expected as boolean);
    });
  });
});

describe("pickHighestMatchingLevel", () => {
  [
    [
      ["basic+liveness", "plus+liveness+email", "plus+liveness+email+phoneNumber"],
      "plus",
      ["email"],
      "plus+liveness+email+phoneNumber",
    ],
    [
      ["basic+liveness", "plus+liveness+email", "plus+liveness+email+phoneNumber"],
      "plus",
      ["email", "phoneNumber"],
      "plus+liveness+email+phoneNumber",
    ],
    [
      ["basic+liveness", "plus+liveness+email", "plus+liveness+email"],
      "plus",
      ["email", "phoneNumber"],
      null,
    ],
    [["basic+liveness", "plus+liveness"], "basic", ["liveness"], "plus+liveness"],
  ].forEach(([levels, requiredLevel, requiredAddons, expected]) => {
    it(`levels=${levels} requiredLevel=${requiredLevel} requiredAddons=[${(requiredAddons as string[]).join(",")}] => ${expected}`, () => {
      expect(
        pickHighestMatchingLevel(
          levels as string[],
          requiredLevel as "basic" | "plus",
          requiredAddons as ("liveness" | "email" | "phoneNumber")[],
        ),
      ).toBe(expected);
    });
  });
});

describe("deriveLevel", () => {
  it("basic only", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        // @ts-expect-error - to test absence of selfieFile
        selfieFile: undefined,
      }),
    ).toBe("basic");
  });

  it("basic+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
      }),
    ).toBe("basic+liveness");
  });

  it("plus+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        residentialAddress: {
          street: "123 Main St",
          city: "Anytown",
          postalCode: "12345",
          country: "US",
          proofCategory: "UTILITY_BILL",
          proofFile: Buffer.from("Utility Bill"),
        },
      }),
    ).toBe("plus+liveness");
  });

  it("plus+liveness+phoneNumber", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        selfieFile: Buffer.from("Selfie"),
        phoneNumber: "+1234567890",
        email: "john.doe@example.com",
        residentialAddress: {
          street: "123 Main St",
          city: "Anytown",
          postalCode: "12345",
          country: "US",
          proofCategory: "UTILITY_BILL",
          proofFile: Buffer.from("Utility Bill"),
        },
      }),
    ).toBe("plus+liveness+email+phoneNumber");
  });
});
