import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

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
const CREDENTIALS_V1_CONTEXT =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credentials-v1.json";
const CREDENTIALS_V2_CONTEXT =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credentials-v2.json";
const FACE_ID_V1_SUBJECT_CONTEXT =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-face-id-v1.json";
const KYC_V1_SUBJECT_CONTEXT =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v1.json";
const KYC_V2_SUBJECT_CONTEXT =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v2.json";
const KYC_V3_SUBJECT_CONTEXT =
  "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v3.json";
const FRONT_FILE = "<~7WNEbF8~>";
const PROOF_FILE = "<~:i^JmAc~>";
const SELFIE_FILE = "<~;e9cWBk7~>";
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
    const parsed = await parseCredential(
      credential(CREDENTIALS_V2_CONTEXT, {
        "@context": [KYC_V3_SUBJECT_CONTEXT],
        id: "uuid:abc",
        personFirstName: "John",
        personFamilyName: "Lennon",
        personGender: "M",
        personNationality: "US",
        personDateOfBirth: "1980-01-01T00:00:00.000Z",
        personPlaceOfBirth: "New York, NY",
        idDocumentCountry: "US",
        idDocumentNumber: "123456789",
        idDocumentType: "PASSPORT",
        idDocumentDateOfIssue: "2022-01-01T00:00:00.000Z",
        idDocumentDateOfExpiry: "2025-01-01T00:00:00.000Z",
        idDocumentFrontFile: FRONT_FILE,
        contactEmail: "john@example.com",
        contactPhoneNumber: "+1234567890",
        biometricSelfieFile: SELFIE_FILE,
        residentialAddressVerified: true,
        residentialAddressStreet: "Main St",
        residentialAddressCity: "New York",
        residentialAddressCountry: "US",
        residentialAddressProofCategory: "UTILITY_BILL",
        residentialAddressProofFile: PROOF_FILE,
        screeningSanctionsCheckResult: "CLEAR",
        screeningPepCheckResult: "CLEAR",
        sourceOfWealthType: "SALARY",
        sourceOfWealthYearlyGrossIncome: "LESS_THAN_20000",
        sourceOfWealthYearlyGrossIncomeCurrency: "EUR",
        sourceOfWealthApproximateNetWorth: "UP_TO_25000",
        sourceOfWealthApproximateNetWorthCurrency: "EUR",
        sourceOfWealthSourceOfWealthProofFile: PROOF_FILE,
      }),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV3);
    if (!(parsed instanceof VerifiableCredentialKycV3)) throw new Error("expected kyc v3");
    expect(parsed.subject.root).toEqual({ id: "uuid:abc" });
    expect(parsed.subject.person).toEqual({
      firstName: "John",
      familyName: "Lennon",
      gender: "M",
      nationality: "US",
      dateOfBirth: new Date("1980-01-01T00:00:00.000Z"),
      placeOfBirth: "New York, NY",
    });
    expect(parsed.subject.idDocument).toMatchObject({
      country: "US",
      number: "123456789",
      type: "PASSPORT",
      dateOfIssue: new Date("2022-01-01T00:00:00.000Z"),
      dateOfExpiry: new Date("2025-01-01T00:00:00.000Z"),
    });
    expect(parsed.subject.idDocument?.frontFile?.toString()).toBe("Front");
    expect(parsed.subject.contact).toEqual({
      email: "john@example.com",
      phoneNumber: "+1234567890",
    });
    expect(parsed.subject.biometric?.selfieFile.toString()).toBe("Selfie");
    expect(parsed.subject.residentialAddress).toMatchObject({
      street: "Main St",
      city: "New York",
      country: "US",
      proofCategory: "UTILITY_BILL",
    });
    expect(parsed.subject.residentialAddress?.proofFile?.toString()).toBe("Proof");
    expect(parsed.subject.screening).toEqual({
      sanctionsCheckResult: "CLEAR",
      pepCheckResult: "CLEAR",
    });
    expect(parsed.subject.sourceOfWealth).toMatchObject({
      type: "SALARY",
      yearlyGrossIncome: "LESS_THAN_20000",
      approximateNetWorth: "UP_TO_25000",
    });
    expect(parsed.subject.sourceOfWealth?.sourceOfWealthProofFile?.toString()).toBe("Proof");
  });

  it("returns a deserialized FaceId v1 container", async () => {
    const parsed = await parseCredential(
      credential(CREDENTIALS_V1_CONTEXT, {
        "@context": [FACE_ID_V1_SUBJECT_CONTEXT],
        faceSignUserId: "11111111-1111-1111-1111-111111111111",
      }),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialFaceIdV1);
    if (!(parsed instanceof VerifiableCredentialFaceIdV1)) throw new Error("expected faceId");
    expect(parsed.subject.root).toEqual({
      faceSignUserId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("returns a deserialized KYC v1 container", async () => {
    const parsed = await parseCredential(
      credential(CREDENTIALS_V1_CONTEXT, {
        "@context": [KYC_V1_SUBJECT_CONTEXT],
        id: "uuid:v1",
        firstName: "Ada",
        idDocumentCountry: "US",
        idDocumentNumber: "123456789",
        idDocumentType: "PASSPORT",
        idDocumentFrontFile: FRONT_FILE,
      }),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV1);
    if (!(parsed instanceof VerifiableCredentialKycV1)) throw new Error("expected kyc v1");
    expect(parsed.subject.root).toEqual({
      id: "uuid:v1",
      firstName: "Ada",
    });
    expect(parsed.subject.idDocument).toMatchObject({
      country: "US",
      number: "123456789",
      type: "PASSPORT",
    });
    expect(parsed.subject.idDocument?.frontFile?.toString()).toBe("Front");
  });

  it("returns a deserialized KYC v2 container", async () => {
    const parsed = await parseCredential(
      credential(CREDENTIALS_V1_CONTEXT, {
        "@context": [KYC_V2_SUBJECT_CONTEXT],
        id: "uuid:v2",
        firstName: "Grace",
        dateOfBirth: "1906-12-09T00:00:00.000Z",
        selfieFile: SELFIE_FILE,
      }),
    );

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV2);
    if (!(parsed instanceof VerifiableCredentialKycV2)) throw new Error("expected kyc v2");
    expect(parsed.subject.root).toEqual({
      id: "uuid:v2",
      firstName: "Grace",
      dateOfBirth: new Date("1906-12-09T00:00:00.000Z"),
      selfieFile: Buffer.from("Selfie"),
    });
  });

  it("throws for an unknown subject context", async () => {
    await expect(
      parseCredential(credential("unknown-envelope", { "@context": "unknown-subject" })),
    ).rejects.toThrow("Unknown credential");
  });

  it("rejects a matching KYC v3 context with invalid subject data", async () => {
    await expect(
      parseCredential(
        credential(CREDENTIALS_V2_CONTEXT, {
          "@context": [KYC_V3_SUBJECT_CONTEXT],
          id: "uuid:abc",
          personFirstName: "John",
          personNationality: "US",
          personDateOfBirth: "1980-01-01T00:00:00.000Z",
          personGender: "MALE", // invalid: enum is M | F | OTHER
          // invalid: mandatory idDocument section is missing entirely
        }),
      ),
    ).rejects.toThrow(ZodError);
  });
});
