import { describe, expect, it } from "vitest";

import type { CredentialSubjectKYCLatestBuilderType } from "../types";

import {
  deriveLevel,
  highestMatchingCredential,
  matchLevelOrHigher,
  pickHighestMatchingLevel,
  recordFilter,
} from "./";

const defaultCredential: CredentialSubjectKYCLatestBuilderType = {
  root: {
    id: "uuid:1234567890",
  },
  person: {
    firstName: "John",
    familyName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
  },
  contact: {
    email: "john.doe@example.com",
    phoneNumber: "+1234567890",
  },
  biometric: {
    selfieFile: Buffer.from("Selfie"),
  },
  idDocument: {
    type: "PASSPORT",
    number: "123456789",
    country: "US",
    dateOfExpiry: new Date("2026-01-01"),
    dateOfIssue: new Date("2021-01-01"),
    issuingAuthority: "US Department of State",
    frontFile: Buffer.from("ID Document Front"),
    backFile: Buffer.from("ID Document Back"),
    mrzLine1: "12345678901234567890123456789012",
  },
  residentialAddress: {
    street: "123 Main St",
    city: "Anytown",
    postalCode: "12345",
    country: "US",
    proofCategory: "UTILITY_BILL",
    proofFile: Buffer.from("Utility Bill"),
    ipCountry: "US",
  },
  screening: {
    sanctionsCheckResult: "CLEAR",
    sanctionsConfidenceScore: 0.95,
    pepCheckResult: "CLEAR",
    pepConfidenceScore: 0.95,
  },
  edd: {
    occupation: "REAL_ESTATE",
    sourceOfFundsProof: Buffer.from("Source of Funds Proof"),
  },
  sourceOfWealth: {
    type: "CRYPTO_TRADING",
  },
};

describe("recordFilter", () => {
  [
    [
      { level: "basic+liveness", status: "approved", issuer: "issuer-a", type: "kyc" },
      { level: ["basic+liveness", "plus+liveness"], status: ["approved"] },
      {},
      true,
    ],
    [
      { level: "plus+liveness", status: "approved", issuer: "issuer-a", type: "kyc" },
      { level: ["basic+liveness"], status: ["approved"] },
      {},
      false,
    ],
    [
      { level: "basic+liveness", status: "approved", issuer: "issuer-a", type: "kyc" },
      { level: ["basic+liveness"], status: ["approved"] },
      { issuer: ["issuer-b", "issuer-a"] },
      false,
    ],
    [
      { level: "basic+liveness", status: "approved", issuer: "issuer-a", type: "kyc" },
      { level: ["basic+liveness"], status: ["approved"] },
      { issuer: ["issuer-b"] },
      true,
    ],
    [{ level: "plus+liveness", status: "approved", issuer: "issuer-a", type: "kyc" }, {}, {}, true],
    [
      { credentialSubject: { nationality: "CZ" } },
      { "credentialSubject.nationality": ["CZ", "DE"] },
      {},
      true,
    ],
    [
      { credentialSubject: { nationality: "CZ" } },
      {},
      { "credentialSubject.nationality": ["CZ", "DE"] },
      false,
    ],
  ].forEach(([publicNotes, pick, omit, expected]) => {
    it(`publicNotes=${JSON.stringify(publicNotes)}, pick=${JSON.stringify(pick)}, omit=${JSON.stringify(omit)} => ${expected}`, () => {
      const result = recordFilter(
        publicNotes as Record<string, unknown>,
        pick as Record<string, unknown[]>,
        omit as Record<string, unknown[]>,
      );

      expect(result).toBe(expected);
    });
  });
});

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

describe("highestMatchingCredential", () => {
  it("choose basic, because plus did not match constraints", () => {
    const credentials = [
      {
        public_notes: JSON.stringify({
          level: "basic+liveness+email",
          issuer: "custom-issuer",
          status: "approved",
        }),
      },
      {
        public_notes: JSON.stringify({
          level: "plus+liveness",
          issuer: "custom-issuer",
          status: "pending",
        }),
      },
    ];

    const matchedCredentials = highestMatchingCredential(credentials, "basic", {
      addons: ["email"],
      publicNotesConstraint: { status: "approved" },
    });

    expect(matchedCredentials).toEqual(credentials[0]);
  });

  it("choose plus+liveness+email+phoneNumber because it has better score", () => {
    const credentials = [
      {
        public_notes: JSON.stringify({
          level: "plus+liveness+email+phoneNumber",
        }),
      },
      {
        public_notes: JSON.stringify({
          level: "plus+liveness+email",
        }),
      },
    ];

    const matchedCredentials = highestMatchingCredential(credentials, "basic", {
      addons: ["email"],
    });

    expect(matchedCredentials).toEqual(credentials[0]);
  });

  it("choose plus+liveness because it has better score", () => {
    const credentials = [
      {
        public_notes: JSON.stringify({
          level: "basic+liveness+email+phoneNumber",
        }),
      },
      {
        public_notes: JSON.stringify({
          level: "plus+liveness",
        }),
      },
    ];

    const matchedCredentials = highestMatchingCredential(credentials, "basic", {
      addons: ["liveness"],
    });

    expect(matchedCredentials).toEqual(credentials[1]);
  });

  it("choose basic+liveness+email because plus has no email", () => {
    const credentials = [
      {
        public_notes: JSON.stringify({
          level: "plus+liveness",
        }),
      },
      {
        public_notes: JSON.stringify({
          level: "basic+liveness+email",
        }),
      },
    ];

    const matchedCredentials = highestMatchingCredential(credentials, "basic", {
      addons: ["email"],
    });

    expect(matchedCredentials).toEqual(credentials[1]);
  });

  it("choose nothing because it did not match the constraints", () => {
    const credentials = [
      {
        public_notes: JSON.stringify({
          level: "plus+liveness",
          status: "pending",
          type: "kyc",
        }),
      },
      {
        public_notes: JSON.stringify({
          level: "basic+liveness+email",
          status: "pending",
          type: "kyc",
        }),
      },
    ];

    const matchedCredentials = highestMatchingCredential(credentials, "basic", {
      addons: ["liveness"],
      publicNotesConstraint: { status: "approved", type: "kyc" },
    });

    expect(matchedCredentials).toBeUndefined();
  });
});

describe("deriveLevel", () => {
  it("basic only", () => {
    expect(
      deriveLevel({
        root: {
          id: "uuid:1234567890",
        },
        person: {
          firstName: "John",
          familyName: "Doe",
          dateOfBirth: new Date("1990-01-01"),
        },
      }),
    ).toBe("basic");
  });

  it("basic+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        residentialAddress: undefined,
        contact: undefined,
      }),
    ).toBe("basic+liveness");
  });

  it("plus+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        contact: undefined,
      }),
    ).toBe("plus+liveness");
  });

  it("plus+liveness+phoneNumber", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        biometric: {
          selfieFile: Buffer.from("Selfie"),
        },
        contact: {
          phoneNumber: "+1234567890",
          email: "john.doe@example.com",
        },
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
