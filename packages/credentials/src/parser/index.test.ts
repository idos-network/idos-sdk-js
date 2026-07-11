import { describe, expect, it } from "vitest";

import { parseCredential } from ".";
import {
  VerifiableCredentialFaceIdV1,
  VerifiableCredentialKycV1,
  VerifiableCredentialKycV2,
  VerifiableCredentialKycV3,
  type VerifiableCredential,
} from "../types";

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

const proof = {
  type: "Ed25519Signature2020",
  created: new Date("2022-01-01").toISOString(),
  verificationMethod: `${ISSUER}/keys/1`,
  proofValue: "proof",
  proofPurpose: "assertionMethod",
};

function credential<TSubject>(
  envelopeContext: string,
  credentialSubject: TSubject,
): VerifiableCredential<TSubject> & typeof envelopeFields {
  return {
    "@context": ["https://www.w3.org/2018/credentials/v1", envelopeContext],
    type: ["VerifiableCredential"],
    issuer: ISSUER,
    ...envelopeFields,
    credentialSubject,
    issuanceDate: envelopeFields.issued,
    proof,
  };
}

describe("parseCredential", () => {
  it("returns a deserialized KYC v3 container", async () => {
    const original = new VerifiableCredentialKycV3();
    original.setMandatoryEnvelopeFields(envelopeFields);
    original.setMandatoryFields(
      { id: "uuid:abc" },
      {
        firstName: "John",
        familyName: "Lennon",
        gender: "M",
        nationality: "US",
        dateOfBirth: new Date("1980-01-01"),
        placeOfBirth: "New York, NY",
      },
      {
        country: "US",
        number: "123456789",
        type: "PASSPORT",
        dateOfIssue: new Date("2022-01-01"),
        dateOfExpiry: new Date("2025-01-01"),
        frontFile: Buffer.from("Front"),
      },
    );
    original.addContact({ email: "john@example.com", phoneNumber: "+1234567890" });
    original.addBiometric({ selfieFile: Buffer.from("Selfie") });
    original.addResidentialAddress({
      street: "Main St",
      city: "New York",
      country: "US",
      proofCategory: "Utility Bill",
      proofFile: Buffer.from("Proof"),
    });
    original.addScreening({ sanctionsCheckResult: "CLEAR", pepCheckResult: "CLEAR" });
    original.addSourceOfWealth({ type: "SALARY" });

    const parsed = await parseCredential(
      credential(original.envelopeContext, original.serialize()),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV3);
    if (!(parsed instanceof VerifiableCredentialKycV3)) throw new Error("expected kyc v3");
    expect(() => parsed.checkValidity()).not.toThrow();
    expect(parsed.envelope.level).toBe("human");
    expect(parsed.envelope.kycLevel).toBe(1);
    expect(parsed.subject.person?.firstName).toBe("John");
    expect(parsed.subject.person?.dateOfBirth).toEqual(new Date("1980-01-01"));
    expect(parsed.subject.idDocument?.frontFile?.toString()).toBe("Front");
  });

  it("returns a deserialized FaceId v1 container", async () => {
    const original = new VerifiableCredentialFaceIdV1();
    original.setMandatoryEnvelopeFields({
      id: CRED_ID,
      level: "human",
      approvedAt: new Date("2022-01-01"),
    });
    original.setMandatoryFields({ faceSignUserId: "11111111-1111-1111-1111-111111111111" });

    const parsed = await parseCredential(
      credential(original.envelopeContext, original.serialize()),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialFaceIdV1);
    if (!(parsed instanceof VerifiableCredentialFaceIdV1)) throw new Error("expected faceId");
    expect(() => parsed.checkValidity()).not.toThrow();
    expect(parsed.subject.root?.faceSignUserId).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("returns a deserialized KYC v1 container", async () => {
    const original = new VerifiableCredentialKycV1();
    original.setMandatoryEnvelopeFields({ id: CRED_ID, level: "human" });
    original.setMandatoryFields({ id: "uuid:v1", firstName: "Ada" });
    original.addIdDocument({
      country: "US",
      number: "123456789",
      type: "PASSPORT",
      frontFile: Buffer.from("Front"),
    });

    const parsed = await parseCredential(
      credential(original.envelopeContext, original.serialize()),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV1);
    if (!(parsed instanceof VerifiableCredentialKycV1)) throw new Error("expected kyc v1");
    expect(() => parsed.checkValidity()).not.toThrow();
    expect(parsed.subject.root?.firstName).toBe("Ada");
    expect(parsed.subject.idDocument?.frontFile?.toString()).toBe("Front");
  });

  it("returns a deserialized KYC v2 container", async () => {
    const original = new VerifiableCredentialKycV2();
    original.setMandatoryEnvelopeFields(envelopeFields);
    original.setMandatoryFields({ id: "uuid:v2", firstName: "Grace" });

    const parsed = await parseCredential(
      credential(original.envelopeContext, original.serialize()),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV2);
    if (!(parsed instanceof VerifiableCredentialKycV2)) throw new Error("expected kyc v2");
    expect(() => parsed.checkValidity()).not.toThrow();
    expect(parsed.subject.root?.firstName).toBe("Grace");
  });

  it("throws for an unknown subject context", async () => {
    await expect(
      parseCredential(credential("unknown-envelope", { "@context": "unknown-subject" })),
    ).rejects.toThrow("Unknown credential");
  });
});
