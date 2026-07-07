import { base64Decode, base64Encode, hexDecode, utf8Encode } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import {
  buildInsertableIDOSCredential,
  highestMatchingCredential,
  matchLevelOrHigher,
  pickHighestMatchingLevel,
  recordFilter,
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

describe("buildInsertableIDOSCredential", () => {
  it("builds an insertable credential with verifiable signatures", () => {
    const userId = "user-1";
    const publicNotes = JSON.stringify({ type: "kyc", level: "basic" });
    const content = base64Encode(utf8Encode(JSON.stringify({ firstName: "Ada" })));
    const encryptorPublicKey = base64Encode(new Uint8Array([1, 2, 3, 4]));

    const credential = buildInsertableIDOSCredential(
      userId,
      publicNotes,
      content,
      encryptorPublicKey,
    );

    const issuerAuthPublicKey = hexDecode(credential.issuer_auth_public_key);
    const publicNotesSignature = base64Decode(credential.public_notes_signature);

    expect(credential).toMatchObject({
      user_id: userId,
      content,
      public_notes: publicNotes,
      encryptor_public_key: encryptorPublicKey,
    });
    expect(issuerAuthPublicKey).toHaveLength(nacl.sign.publicKeyLength);
    expect(publicNotesSignature).toHaveLength(nacl.sign.signatureLength);
    expect(base64Decode(credential.broader_signature)).toHaveLength(nacl.sign.signatureLength);
    expect(
      nacl.sign.detached.verify(utf8Encode(publicNotes), publicNotesSignature, issuerAuthPublicKey),
    ).toBe(true);
    expect(
      nacl.sign.detached.verify(
        Uint8Array.from([...publicNotesSignature, ...base64Decode(content)]),
        base64Decode(credential.broader_signature),
        issuerAuthPublicKey,
      ),
    ).toBe(true);
  });

  it("requires an encryptor public key", () => {
    expect(() => buildInsertableIDOSCredential("user-1", "{}", "content", "")).toThrow(
      "Missing `encryptorPublicKey`",
    );
  });
});
