import { hexEncode, utf8Encode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import {
  buildEphemeralSignedCredentialContentReference,
  buildPreliminaryIDOSCredential,
  buildSignedCredentialContentReference,
  claimsFromPublicNotes,
  highestMatchingCredential,
  matchClaims,
  matchLevelOrHigher,
  pickHighestMatchingLevel,
  recordFilter,
  type Addon,
  type BaseLevel,
} from ".";

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
    ["unverified", [], "unverified", true],
    ["unverified", [], "basic", true],
    ["basic", [], "unverified", false],
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
        matchLevelOrHigher(level as BaseLevel, requiredAddons as Addon[], testLevel as string),
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
    [
      ["unverified+phoneNumber", "basic+phoneNumber", "plus+phoneNumber"],
      "unverified",
      ["phoneNumber"],
      "plus+phoneNumber",
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

describe("matchClaims", () => {
  it("matches each claim against its accepted sources", () => {
    const publicNotes = {
      level: "basic",
      claims: { identity: "VERIFIED", email: "MANUAL" },
    } as const;

    expect(matchClaims({ email: ["VERIFIED", "MANUAL"] }, publicNotes)).toBe(true);
    expect(matchClaims({ email: ["VERIFIED"] }, publicNotes)).toBe(false);
    expect(matchClaims({ identity: ["VERIFIED"], liveness: ["LIVENESS"] }, publicNotes)).toBe(
      false,
    );
    expect(matchClaims({}, publicNotes)).toBe(true);
    // @ts-expect-error - an unknown source is a type error, not a silent non-match
    expect(matchClaims({ email: ["APPROVED"] }, publicNotes)).toBe(false);
    // @ts-expect-error - each claim only takes its own sources: an address is never VERIFIED
    expect(matchClaims({ address: ["VERIFIED"] }, publicNotes)).toBe(false);
    // @ts-expect-error - onboarding is always self-attested
    expect(matchClaims({ onboarding: ["VERIFIED"] }, publicNotes)).toBe(false);
  });

  it("derives the claims of a credential issued before claims from its level", () => {
    expect(claimsFromPublicNotes({ level: "plus+liveness+email" })).toEqual({
      identity: "VERIFIED",
      address: "PROOF_OF_ADDRESS",
      liveness: "LIVENESS",
      email: "VERIFIED",
    });
    expect(claimsFromPublicNotes({ level: "unverified+phoneNumber+screening+onboarding" })).toEqual(
      {
        phoneNumber: "VERIFIED",
        screening: "DB",
        onboarding: "MANUAL",
      },
    );
    expect(claimsFromPublicNotes({})).toEqual({});
    expect(matchClaims({ liveness: ["LIVENESS"] }, { level: "basic+liveness" })).toBe(true);
  });
});

describe("highestMatchingCredential", () => {
  it("matches claims against the accepted sources", () => {
    const credentials = [
      {
        public_notes: JSON.stringify({
          level: "plus+liveness+email",
          claims: { email: "VERIFIED" },
        }),
      },
      { public_notes: JSON.stringify({ level: "basic+liveness", claims: { email: "MANUAL" } }) },
      { public_notes: JSON.stringify({ level: "plus+liveness+phoneNumber" }) },
    ];

    expect(
      highestMatchingCredential(credentials, "basic", { claims: { email: ["MANUAL"] } }),
    ).toEqual(credentials[1]);
    expect(
      highestMatchingCredential(credentials, "basic", {
        claims: { email: ["VERIFIED", "MANUAL"] },
      }),
    ).toEqual(credentials[0]);
    expect(
      highestMatchingCredential(credentials, "basic", { claims: { address: ["MANUAL"] } }),
    ).toBeUndefined();
    // The last one has no claims, so they come from its level.
    expect(
      highestMatchingCredential(credentials, "basic", {
        claims: { address: ["PROOF_OF_ADDRESS"] },
      }),
    ).toEqual(credentials[2]);
  });

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

describe("buildSignedCredentialContentReference", () => {
  it("derives issuer_auth_public_key from the signing secret key", () => {
    const keyPair = nacl.sign.keyPair();
    const result = buildSignedCredentialContentReference("", "ipfs://cid", keyPair.secretKey);

    expect(result.public_notes).toBe("");
    expect(result.public_notes_signature).toBeTruthy();
    expect(result.broader_signature).toBeTruthy();
    expect(result.issuer_auth_public_key).toBe(hexEncode(keyPair.publicKey, true));
  });
});

describe("buildEphemeralSignedCredentialContentReference", () => {
  it("returns a signed reference with a public key", () => {
    const result = buildEphemeralSignedCredentialContentReference("", "ipfs://cid");

    expect(result.public_notes).toBe("");
    expect(result.public_notes_signature).toBeTruthy();
    expect(result.broader_signature).toBeTruthy();
    expect(result.issuer_auth_public_key).toMatch(/^(0x)?[0-9a-f]+$/i);
  });
});

describe("buildPreliminaryIDOSCredential", () => {
  const recipient = nacl.box.keyPair();

  it("hashes encrypted content to an ipfs:// uri by default", async () => {
    const result = await buildPreliminaryIDOSCredential({
      publicNotes: "{}",
      plaintextContent: utf8Encode("secret"),
      recipientEncryptionPublicKey: recipient.publicKey,
    });

    expect(result.contentUri).toMatch(/^ipfs:\/\//);
    expect(result.contentSize).toBe(result.encryptedContent.byteLength);
  });

  it("uses a provided contentUri instead of hashing to ipfs", async () => {
    const result = await buildPreliminaryIDOSCredential({
      publicNotes: "{}",
      plaintextContent: utf8Encode("secret"),
      recipientEncryptionPublicKey: recipient.publicKey,
      contentUri: "ukyc://storage-abc/blobs/blob-1",
    });

    expect(result.contentUri).toBe("ukyc://storage-abc/blobs/blob-1");
    expect(result.contentSize).toBe(result.encryptedContent.byteLength);
  });
});
