import { base85ToFile, fileToBase85 } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";

import { VerifiableCredentialKycV3 } from "./index";

describe("VerifiableCredentialKycV3.serializeSubject", () => {
  it("is valid with required fields", () => {
    const credential = new VerifiableCredentialKycV3();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
    });

    credential.setMandatoryFields({ id: "uuid:abc" });
    credential.add("person", {
      firstName: "John",
      familyName: "Doe",
      nationality: "US",
      dateOfBirth: new Date("1990-01-01"),
    });
    credential.add("idDocument", {
      type: "PASSPORT",
      number: "123456789",
      country: "US",
      frontFile: Buffer.from("Front"),
    });

    credential.add("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });

    expect(() => credential.checkValidity()).not.toThrow();

    expect(credential.level()).toBe("basic+liveness");
  });

  it("derives level and kycLevel on serialize when omitted from envelope", () => {
    const credential = new VerifiableCredentialKycV3();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
    });

    credential.setMandatoryFields({ id: "uuid:abc" });
    credential.add("person", {
      firstName: "John",
      familyName: "Doe",
      nationality: "US",
      dateOfBirth: new Date("1990-01-01"),
    });
    credential.add("idDocument", {
      type: "PASSPORT",
      number: "123456789",
      country: "US",
      frontFile: Buffer.from("Front"),
    });
    credential.add("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.add("contact", { email: "john@example.com" });

    expect(credential.envelope.level).toBeUndefined();
    expect(credential.envelope.kycLevel).toBeUndefined();

    credential.serializeSubject();

    expect(credential.envelope.level).toBe("basic+liveness+email");
    expect(credential.envelope.kycLevel).toBe(1);
  });

  it("accepts manual residential address when verified is false", async () => {
    const credential = new VerifiableCredentialKycV3();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
    });

    credential.setMandatoryFields({ id: "uuid:abc" });
    credential.add("person", {
      firstName: "John",
      familyName: "Doe",
      nationality: "US",
      dateOfBirth: new Date("1990-01-01"),
    });
    credential.add("idDocument", {
      type: "PASSPORT",
      number: "123456789",
      country: "US",
      frontFile: Buffer.from("Front"),
    });
    credential.add("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.add("residentialAddress", {
      verified: false,
      street: "Oak Ave",
      houseNumber: "42",
      city: "Boston",
      postalCode: "02108",
      country: "US",
    });

    expect(() => credential.checkValidity()).not.toThrow();
    expect(credential.level()).toBe("basic+liveness");
    expect(credential.kycLevel()).toBe(1);

    const serialized = credential.serializeSubject() as Record<string, unknown>;
    expect(serialized.residentialAddressVerified).toBe(false);
    expect(serialized.residentialAddressStreet).toBe("Oak Ave");
    expect(serialized.residentialAddressHouseNumber).toBe("42");
    expect(serialized.residentialAddressCity).toBe("Boston");
    expect(serialized.residentialAddressPostalCode).toBe("02108");
    expect(serialized.residentialAddressCountry).toBe("US");
    expect(serialized.residentialAddressProofCategory).toBeUndefined();
    expect(serialized.residentialAddressProofFile).toBeUndefined();

    const roundTrip = new VerifiableCredentialKycV3();
    await roundTrip.deserialize({
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
      credentialSubject: serialized,
      proof: {
        type: "Ed25519Signature2020",
        created: new Date("2022-01-01").toISOString(),
        verificationMethod: "did:example:issuer#key-1",
        proofValue: "proof",
        proofPurpose: "assertionMethod",
      },
    });

    expect(roundTrip.subject.residentialAddress).toEqual({
      verified: false,
      street: "Oak Ave",
      houseNumber: "42",
      city: "Boston",
      postalCode: "02108",
      country: "US",
    });
  });

  it("flattens every KYC v3 section into the credential subject", () => {
    const credential = new VerifiableCredentialKycV3();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      issued: new Date("2022-01-01").toISOString(),
      approvedAt: new Date("2022-01-02").toISOString(),
      expirationDate: new Date("2030-01-01").toISOString(),
    });

    credential.setMandatoryFields({ id: "uuid:abc" });
    credential.add("person", {
      firstName: "John",
      familyName: "Doe",
      gender: "M",
      nationality: "US",
      dateOfBirth: new Date("1990-01-01"),
      placeOfBirth: "New York, NY",
    });
    credential.add("idDocument", {
      type: "PASSPORT",
      number: "123456789",
      country: "US",
      dateOfIssue: new Date("2020-01-01"),
      dateOfExpiry: new Date("2030-01-01"),
      issuingAuthority: "US Department of State",
      frontFile: Buffer.from("Front"),
      backFile: Buffer.from("Back"),
      // cspell:disable-next-line
      mrzLine1: "P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<",
    });
    credential.add("contact", { email: "john@example.com", phoneNumber: "+1234567890" });
    credential.add("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.add("residentialAddress", {
      verified: true,
      street: "Main St",
      city: "New York",
      country: "US",
      proofCategory: "UTILITY_BILL",
      proofDateOfIssue: new Date("2021-01-01"),
      proofFile: Buffer.from("Proof"),
      ipCountry: "US",
    });
    credential.add("screening", {
      sanctionsCheckResult: "CLEAR",
      sanctionsConfidenceScore: 95,
      pepCheckResult: "NOT_CHECKED",
      pepConfidenceScore: 10,
    });
    credential.add("edd", {
      occupation: "REAL_ESTATE",
      sourceOfFundsCategory: "SALARY",
      sourceOfFundsProofFile: Buffer.from("Funds"),
    });
    credential.add("sourceOfWealth", {
      type: "SALARY",
      yearlyGrossIncome: "LESS_THAN_20000",
      yearlyGrossIncomeCurrency: "EUR",
      approximateNetWorth: "UP_TO_25000",
      approximateNetWorthCurrency: "EUR",
      sourceOfWealthProofFile: Buffer.from("Proof"),
    });
    credential.add("onboarding", {
      intendedUse: "INVESTING",
      employmentStatus: "EMPLOYED",
      expectedMonthlyTransactionCount: "LESS_THAN_5",
      expectedMonthlyTransactionVolume: "MORE_THAN_500_LESS_THAN_2000",
      expectedMonthlyTransactionVolumeCurrency: "EUR",
    });

    expect(credential.level()).toBe("plus+liveness+email+phoneNumber+edd+sow+screening+onboarding");
    expect(credential.kycLevel()).toBe(3);

    expect(credential.publicNotes()).toEqual({
      type: "kyc",
      level: "plus+liveness+email+phoneNumber+edd+sow+screening+onboarding",
      kycLevel: 3,
      proofOfResidency: {
        category: "UTILITY_BILL",
        dateOfIssue: new Date("2021-01-01"),
      },
      proofOfIdentity: {
        type: "PASSPORT",
        dateOfExpiry: new Date("2030-01-01"),
      },
    });

    const envelope = credential.serializeEnvelope();
    expect(envelope.level).toBe("plus+liveness+email+phoneNumber+edd+sow+screening+onboarding");
    expect(envelope.kycLevel).toBe(3);
    expect(envelope.expirationDate).toBe(new Date("2030-01-01").toISOString());

    const serialized = credential.serializeSubject() as Record<string, unknown>;

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
    expect(base85ToFile(serialized.eddSourceOfFundsProofFile as string)?.toString()).toBe("Funds");
    expect(serialized.sourceOfWealthType).toBe("SALARY");
    expect(serialized.sourceOfWealthYearlyGrossIncome).toBe("LESS_THAN_20000");
    expect(serialized.sourceOfWealthYearlyGrossIncomeCurrency).toBe("EUR");
    expect(serialized.sourceOfWealthApproximateNetWorth).toBe("UP_TO_25000");
    expect(serialized.sourceOfWealthApproximateNetWorthCurrency).toBe("EUR");
    expect(
      base85ToFile(serialized.sourceOfWealthSourceOfWealthProofFile as string)?.toString(),
    ).toBe("Proof");
    expect(serialized.onboardingEmploymentStatus).toBe("EMPLOYED");
    expect(serialized.onboardingExpectedMonthlyTransactionCount).toBe("LESS_THAN_5");
    expect(serialized.onboardingExpectedMonthlyTransactionVolume).toBe(
      "MORE_THAN_500_LESS_THAN_2000",
    );
    expect(serialized.onboardingExpectedMonthlyTransactionVolumeCurrency).toBe("EUR");
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
        eddSourceOfFundsProofFile: fileToBase85(Buffer.from("Funds")),
        onboardingIntendedUse: "INVESTING",
        onboardingEmploymentStatus: "EMPLOYED",
        onboardingExpectedMonthlyTransactionCount: "LESS_THAN_5",
        onboardingExpectedMonthlyTransactionVolume: "MORE_THAN_500_LESS_THAN_2000",
        onboardingExpectedMonthlyTransactionVolumeCurrency: "EUR",
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
    expect(credential.subject.edd?.sourceOfFundsProofFile?.toString()).toBe("Funds");
    expect(credential.subject.onboarding?.employmentStatus).toBe("EMPLOYED");
    expect(credential.subject.onboarding?.expectedMonthlyTransactionCount).toBe("LESS_THAN_5");
    expect(credential.subject.onboarding?.expectedMonthlyTransactionVolume).toBe(
      "MORE_THAN_500_LESS_THAN_2000",
    );
  });

  it("checks optional sections for extra fields even when validation is skipped", () => {
    const cases: Array<{
      section:
        | "contact"
        | "biometric"
        | "residentialAddress"
        | "screening"
        | "onboarding"
        | "edd"
        | "sourceOfWealth";
      knownFields: Record<string, unknown>;
    }> = [
      { section: "contact", knownFields: { email: 123 } },
      { section: "biometric", knownFields: { selfieFile: "not-a-buffer" } },
      { section: "residentialAddress", knownFields: { street: 123 } },
      { section: "screening", knownFields: { sanctionsCheckResult: "not-a-real-result" } },
      { section: "onboarding", knownFields: { employmentStatus: "not-a-real-status" } },
      { section: "edd", knownFields: { occupation: "not-a-real-occupation" } },
      { section: "sourceOfWealth", knownFields: { type: "not-a-real-type" } },
    ];

    for (const { section, knownFields } of cases) {
      expect(() =>
        new VerifiableCredentialKycV3().add(section, knownFields as never, false),
      ).not.toThrow();

      expect(() =>
        new VerifiableCredentialKycV3().add(
          section,
          { ...knownFields, unexpectedJsonLdField: "breaks-json-ld" } as never,
          false,
        ),
      ).toThrow(`Unexpected ${section} fields: unexpectedJsonLdField`);
    }
  });
});
