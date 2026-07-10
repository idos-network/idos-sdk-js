import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { describe, expect, it } from "vitest";

import { parseCredential, parseCredentialSubject, parseEnvelope } from ".";
import { buildFaceIdCredential, buildKycCredential } from "../verifier";
import {
  CONTEXT_IDOS_CREDENTIAL_V1,
  CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT,
  CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT,
} from "../utils/loader";

const ISSUER = "https://vc-issuers.cool.id/idos";
const CRED_ID = `${ISSUER}/credentials/z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3`;

const envelopeFields = {
  id: CRED_ID,
  level: "human",
  kycLevel: 1,
  issued: new Date("2022-01-01").toISOString(),
  approvedAt: new Date("2022-01-01").toISOString(),
  expirationDate: new Date("2030-01-01").toISOString(),
};

function key() {
  return Ed25519VerificationKey2020.generate({
    id: `${ISSUER}/keys/1`,
    controller: `${ISSUER}/issuers/1`,
  });
}

describe("parseCredential", () => {
  it("parses a latest (V3 subject / V2 envelope) KYC credential built by the builder", async () => {
    const credential = await buildKycCredential(
      envelopeFields,
      {
        root: { id: "uuid:abc" },
        person: {
          firstName: "John",
          familyName: "Lennon",
          gender: "M",
          nationality: "US",
          dateOfBirth: new Date("1980-01-01"),
          placeOfBirth: "New York, NY",
        },
        contact: { email: "john@example.com", phoneNumber: "+1234567890" },
        idDocument: {
          country: "US",
          number: "123456789",
          type: "PASSPORT",
          dateOfIssue: new Date("2022-01-01"),
          dateOfExpiry: new Date("2025-01-01"),
          frontFile: Buffer.from("Front"),
        },
        biometric: { selfieFile: Buffer.from("Selfie") },
        residentialAddress: {
          street: "Main St",
          city: "New York",
          country: "US",
          proofCategory: "Utility Bill",
          proofFile: Buffer.from("Proof"),
        },
        screening: { sanctionsCheckResult: "CLEAR", pepCheckResult: "CLEAR" },
        sourceOfWealth: { type: "SALARY" },
      },
      await key(),
    );

    const { envelope, subject } = parseCredential(credential);

    expect(envelope.version).toBe("v2");
    expect(subject.type).toBe("kyc");
    expect(subject.version).toBe("v3");

    if (subject.type !== "kyc" || subject.version !== "v3") throw new Error("expected kyc v3");
    expect(subject.subject.personFirstName).toBe("John");
    // @context / proof are stripped by the flat schema
    expect(subject.subject).not.toHaveProperty("@context");
    expect(subject.subject).not.toHaveProperty("proof");

    if (envelope.version !== "v2") throw new Error("expected v2 envelope");
    expect(envelope.envelope.level).toBe("human");
    expect(envelope.envelope.kycLevel).toBe(1);
  });

  it("parses a FaceId credential", async () => {
    const credential = await buildFaceIdCredential(
      envelopeFields,
      { root: { faceSignUserId: "11111111-1111-1111-1111-111111111111" } },
      await key(),
    );

    const { subject } = parseCredential(credential);
    expect(subject.type).toBe("faceId");
    expect(subject.version).toBe("v1");
    if (subject.type !== "faceId") throw new Error("expected faceId");
    expect(subject.subject.faceSignUserId).toBe("11111111-1111-1111-1111-111111111111");
  });
});

describe("parseCredentialSubject", () => {
  it("routes by subject @context (V1 vs V2)", () => {
    const v1 = parseCredentialSubject({
      "@context": CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT,
      id: "uuid:abc",
    });
    expect(v1).toMatchObject({ type: "kyc", version: "v1" });

    const v2 = parseCredentialSubject({
      "@context": CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT,
      id: "uuid:abc",
    });
    expect(v2).toMatchObject({ type: "kyc", version: "v2" });
  });

  it("returns the plain object for an unknown/missing context", () => {
    const raw = { id: "uuid:abc", firstName: "Nobody" };

    expect(parseCredentialSubject(raw)).toEqual({
      type: "unknown",
      version: "unknown",
      subject: raw,
    });

    expect(parseCredentialSubject({ "@context": "https://example.com/whatever" })).toMatchObject({
      type: "unknown",
      version: "unknown",
    });
  });
});

describe("parseEnvelope", () => {
  it("routes by top-level @context array", () => {
    const parsed = parseEnvelope({
      "@context": ["https://www.w3.org/2018/credentials/v1", CONTEXT_IDOS_CREDENTIAL_V1],
      id: CRED_ID,
      level: "human",
    });
    expect(parsed.version).toBe("v1");
  });

  it("returns the plain object for an unknown context", () => {
    const raw = { "@context": ["https://www.w3.org/2018/credentials/v1"], level: "human" };
    expect(parseEnvelope(raw)).toEqual({ version: "unknown", envelope: raw });
  });
});
