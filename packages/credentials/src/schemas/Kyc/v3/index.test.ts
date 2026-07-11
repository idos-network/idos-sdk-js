import { describe, expect, it } from "vitest";

import { base85ToFile, fileToBase85 } from "../../../utils/serialization";
import { VerifiableCredentialKycV3 } from "./index";

describe("VerifiableCredentialKycV3.serialize", () => {
  it("is valid with required fields", () => {
    const credential = new VerifiableCredentialKycV3();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      level: "human",
      kycLevel: 1,
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
    });

    credential.setMandatoryFields(
      { id: "uuid:abc" },
      {
        firstName: "John",
        familyName: "Doe",
        nationality: "US",
        dateOfBirth: new Date("1990-01-01"),
      },
      {
        type: "PASSPORT",
        number: "123456789",
        country: "US",
        frontFile: Buffer.from("Front"),
      },
    );

    expect(() => credential.checkValidity()).not.toThrow();
  });

  it("flattens every KYC v3 section into the credential subject", () => {
    const credential = new VerifiableCredentialKycV3();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      level: "human",
      kycLevel: 1,
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
    });

    credential.setMandatoryFields(
      { id: "uuid:abc" },
      {
        firstName: "John",
        familyName: "Doe",
        gender: "M",
        nationality: "US",
        dateOfBirth: new Date("1990-01-01"),
        placeOfBirth: "New York, NY",
      },
      {
        type: "PASSPORT",
        number: "123456789",
        country: "US",
        dateOfIssue: new Date("2020-01-01"),
        dateOfExpiry: new Date("2030-01-01"),
        issuingAuthority: "US Department of State",
        frontFile: Buffer.from("Front"),
        backFile: Buffer.from("Back"),
        mrzLine1: "P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<",
      },
    );
    credential.addContact({ email: "john@example.com", phoneNumber: "+1234567890" });
    credential.addBiometric({ selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.addResidentialAddress({
      street: "Main St",
      city: "New York",
      country: "US",
      proofCategory: "UTILITY_BILL",
      proofDateOfIssue: new Date("2021-01-01"),
      proofFile: Buffer.from("Proof"),
      ipCountry: "US",
    });
    credential.addScreening({
      sanctionsCheckResult: "CLEAR",
      sanctionsConfidenceScore: 95,
      pepCheckResult: "NOT_CHECKED",
      pepConfidenceScore: 10,
    });
    credential.addEDD({
      occupation: "REAL_ESTATE",
      sourceOfFundsProof: Buffer.from("Funds"),
    });
    credential.addSourceOfWealth({ type: "SALARY" });

    const serialized = credential.serialize() as Record<string, unknown>;

    expect(serialized["@context"]).toEqual([
      "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v3.json",
    ]);
    expect(serialized.id).toBe("uuid:abc");
    expect(serialized.personFirstName).toBe("John");
    expect(serialized.personDateOfBirth).toBe(new Date("1990-01-01").toISOString());
    expect(serialized.idDocumentType).toBe("PASSPORT");
    expect(serialized.idDocumentDateOfIssue).toBe(new Date("2020-01-01").toISOString());
    expect(base85ToFile(serialized.idDocumentFrontFile as string)?.toString()).toBe("Front");
    expect(base85ToFile(serialized.idDocumentBackFile as string)?.toString()).toBe("Back");
    expect(serialized.contactEmail).toBe("john@example.com");
    expect(base85ToFile(serialized.biometricSelfieFile as string)?.toString()).toBe("Selfie");
    expect(serialized.biometricSelfieMatch).toBe(99);
    expect(serialized.residentialAddressStreet).toBe("Main St");
    expect(serialized.residentialAddressProofDateOfIssue).toBe(
      new Date("2021-01-01").toISOString(),
    );
    expect(base85ToFile(serialized.residentialAddressProofFile as string)?.toString()).toBe(
      "Proof",
    );
    expect(serialized.screeningSanctionsCheckResult).toBe("CLEAR");
    expect(serialized.eddOccupation).toBe("REAL_ESTATE");
    expect(base85ToFile(serialized.eddSourceOfFundsProof as string)?.toString()).toBe("Funds");
    expect(serialized.sourceOfWealthType).toBe("SALARY");
  });

  it("deserializes flat envelope and subject fields", async () => {
    const credential = new VerifiableCredentialKycV3();

    await credential.deserialize({
      "@context": [],
      type: ["VerifiableCredential"],
      issuer: "did:example:issuer",
      id: "https://issuer.example/credentials/123",
      level: "human",
      kycLevel: 1,
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
      issuanceDate: new Date("2022-01-01").toISOString(),
      credentialSubject: {
        "@context": [
          "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v3.json",
        ],
        id: "uuid:abc",
        personFirstName: "John",
        personFamilyName: "Doe",
        personNationality: "US",
        personDateOfBirth: new Date("1990-01-01").toISOString(),
        idDocumentType: "PASSPORT",
        idDocumentNumber: "123456789",
        idDocumentCountry: "US",
        idDocumentFrontFile: fileToBase85(Buffer.from("Front")),
        eddSourceOfFundsProof: fileToBase85(Buffer.from("Funds")),
      },
      proof: {
        type: "Ed25519Signature2020",
        created: new Date("2022-01-01").toISOString(),
        verificationMethod: "did:example:issuer#key-1",
        proofValue: "proof",
        proofPurpose: "assertionMethod",
      },
    });

    expect(credential.envelope).toEqual({
      id: "https://issuer.example/credentials/123",
      level: "human",
      kycLevel: 1,
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
    });
    expect(credential.subject.person?.dateOfBirth).toEqual(new Date("1990-01-01"));
    expect(credential.subject.idDocument?.frontFile.toString()).toBe("Front");
    expect(credential.subject.edd?.sourceOfFundsProof?.toString()).toBe("Funds");
  });
});
