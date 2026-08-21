import { base85ToFile, fileToBase85 } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";

import type { VerifiableCredential } from "../../types";

import { KycV3 } from ".";

/** A credential with the required sections filled in, ready to be extended per test. */
function basicCredential(): KycV3 {
  const credential = new KycV3();

  credential.setEnvelope({
    id: "https://issuer.example/credentials/123",
    issued: new Date("2022-01-01"),
    approvedAt: new Date("2022-01-02"),
    expirationDate: new Date("2030-01-01"),
  });

  credential.setSubject({ id: "uuid:abc" });
  credential.addSection("person", {
    firstName: "John",
    familyName: "Doe",
    nationality: "US",
    dateOfBirth: new Date("1990-01-01"),
  });
  credential.addSection("idDocument", {
    type: "PASSPORT",
    number: "123456789",
    country: "US",
    frontFile: Buffer.from("Front"),
  });

  return credential;
}

/** Wraps a flat subject into a credential of the shape `deserialize` accepts. */
function serializedCredential(
  credentialSubject: Record<string, unknown>,
): VerifiableCredential<unknown> {
  return {
    "@context": [],
    type: ["VerifiableCredential"],
    issuer: "did:example:issuer",
    id: "https://issuer.example/credentials/123",
    level: "basic+liveness",
    kycLevel: 1,
    issued: new Date("2022-01-01").toISOString(),
    approvedAt: new Date("2022-01-02").toISOString(),
    expirationDate: new Date("2030-01-01").toISOString(),
    issuanceDate: new Date("2022-01-01").toISOString(),
    credentialSubject,
    proof: {
      type: "Ed25519Signature2020",
      created: new Date("2022-01-01").toISOString(),
      verificationMethod: "did:example:issuer#key-1",
      proofValue: "proof",
      proofPurpose: "assertionMethod",
    },
  } as unknown as VerifiableCredential<unknown>;
}

describe("KycV3 validity", () => {
  it("is valid with required fields", () => {
    const credential = basicCredential();
    credential.addSection("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });

    expect(() => credential.checkValidity()).not.toThrow();
    expect(credential.level()).toBe("basic+liveness");
  });

  it("can issue a level = 0 credentials", async () => {
    const credential = new KycV3();
    credential.setEnvelope({ id: "https://issuer.example/credentials/123" });
    credential.setSubject({ id: "uuid:abc" });
    credential.addSection("person", {
      firstName: "John",
      dateOfBirth: new Date("1990-01-01"),
      nationality: "US",
    });
    credential.addSection("residentialAddress", {
      verified: false,
      street: "Main St",
      city: "New York",
      country: "US",
    });
    credential.addSection("contact", { phoneNumber: "+1234567890" });

    expect(() => credential.checkValidity()).not.toThrow();
    expect(credential.kycLevel()).toBe(0);
    expect(credential.level()).toBe("unverified+phoneNumber");
  });

  it("rejects a subject missing a required section", () => {
    const credential = new KycV3();
    credential.setEnvelope({ id: "https://issuer.example/credentials/123" });
    credential.setSubject({ id: "uuid:abc" });

    expect(() => credential.checkValidity()).toThrow(/person/);
  });

  it("requires one of firstName or familyName", () => {
    expect(() =>
      new KycV3().addSection("person", { nationality: "US", dateOfBirth: new Date("1990-01-01") }),
    ).toThrow(/firstName/);

    expect(() =>
      new KycV3().addSection("person", {
        familyName: "Doe",
        nationality: "US",
        dateOfBirth: new Date("1990-01-01"),
      }),
    ).not.toThrow();
  });

  it("requires a nationality unless stateless or holding a second one", () => {
    expect(() =>
      new KycV3().addSection("person", { firstName: "John", dateOfBirth: new Date("1990-01-01") }),
    ).toThrow(/nationality/);

    expect(() =>
      new KycV3().addSection("person", {
        firstName: "John",
        stateless: true,
        dateOfBirth: new Date("1990-01-01"),
      }),
    ).not.toThrow();

    expect(() =>
      new KycV3().addSection("person", {
        firstName: "John",
        secondNationality: "GB",
        dateOfBirth: new Date("1990-01-01"),
      }),
    ).not.toThrow();
  });

  it("requires proof fields on a verified address, but still checks their types when unverified", () => {
    expect(() =>
      new KycV3().addSection("residentialAddress", {
        verified: true,
        street: "Main St",
        city: "New York",
        country: "US",
      }),
    ).toThrow(/proofCategory|proofFile/);

    expect(() =>
      new KycV3().addSection("residentialAddress", {
        verified: false,
        street: "Oak Ave",
        city: "Boston",
        country: "US",
      }),
    ).not.toThrow();

    expect(() =>
      new KycV3().addSection("residentialAddress", {
        verified: false,
        street: "Oak Ave",
        city: "Boston",
        country: "US",
        proofFile: "not-a-buffer" as never,
      }),
    ).toThrow(/proofFile/);
  });

  it("requires a currency alongside each source-of-wealth amount", () => {
    expect(() =>
      new KycV3().addSection("sourceOfWealth", {
        type: "SALARY",
        yearlyGrossIncome: "LESS_THAN_20000",
      }),
    ).toThrow(/yearlyGrossIncomeCurrency/);

    expect(() =>
      new KycV3().addSection("sourceOfWealth", {
        type: "SALARY",
        approximateNetWorth: "UP_TO_25000",
      }),
    ).toThrow(/approximateNetWorthCurrency/);

    expect(() =>
      new KycV3().addSection("sourceOfWealth", {
        type: "SALARY",
        yearlyGrossIncome: "LESS_THAN_20000",
        yearlyGrossIncomeCurrency: "EUR",
      }),
    ).not.toThrow();
  });

  it("rejects values outside an enum, and out-of-range scores", () => {
    expect(() => new KycV3().addSection("edd", { occupation: "ASTRONAUT" as never })).toThrow(
      /occupation/,
    );

    expect(() =>
      new KycV3().addSection("screening", {
        sanctionsCheckResult: "CLEAR",
        pepCheckResult: "CLEAR",
        pepConfidenceScore: 101,
      }),
    ).toThrow(/pepConfidenceScore/);
  });

  it("rejects a field that's not part of the schema", () => {
    expect(() =>
      new KycV3().addSection("person", {
        firstName: "John",
        nationality: "US",
        dateOfBirth: new Date("1990-01-01"),
        // @ts-expect-error - this field is not part of the schema
        unexpectedJsonLdField: "breaks-json-ld",
      }),
    ).toThrow(/unexpectedJsonLdField/);
  });

  it("rejects an unparseable date", () => {
    expect(() =>
      new KycV3().addSection("person", {
        firstName: "John",
        nationality: "US",
        dateOfBirth: "not-a-date" as never,
      }),
    ).toThrow(/dateOfBirth/);
  });

  it("checks sections for extra fields even when validation is skipped", () => {
    const cases = [
      { section: "contact", knownFields: { email: 123 } },
      { section: "biometric", knownFields: { selfieFile: "not-a-buffer" } },
      { section: "residentialAddress", knownFields: { street: 123 } },
      { section: "screening", knownFields: { sanctionsCheckResult: "not-a-real-result" } },
      { section: "onboarding", knownFields: { employmentStatus: "not-a-real-status" } },
      { section: "edd", knownFields: { occupation: "not-a-real-occupation" } },
      { section: "sourceOfWealth", knownFields: { type: "not-a-real-type" } },
    ] as const;

    for (const { section, knownFields } of cases) {
      expect(() => new KycV3().addSection(section, knownFields as never, false)).not.toThrow();

      expect(() =>
        new KycV3().addSection(
          section,
          { ...knownFields, unexpectedJsonLdField: "breaks-json-ld" } as never,
          false,
        ),
      ).toThrow(`Unexpected ${section} fields: unexpectedJsonLdField`);
    }
  });

  it("accepts a date in either form, and leaves omitted fields alone", () => {
    const credential = basicCredential();
    credential.setEnvelope({
      id: "https://issuer.example/credentials/123",
      issued: new Date("2022-01-01").toISOString() as never,
    });

    expect(credential.envelope.issued).toEqual(new Date("2022-01-01"));
    // A field left out of the second call keeps the value the first one set.
    expect(credential.envelope.approvedAt).toEqual(new Date("2022-01-02"));
    expect(credential.envelope.level).toBeUndefined();
  });

  it("rejects unknown envelope fields", () => {
    expect(() => new KycV3().setEnvelope({ id: "x", bogus: 1 } as never)).toThrow(
      "Unexpected envelope fields: bogus",
    );
  });
});

describe("KycV3 derived fields", () => {
  it("derives level and kycLevel on serialize when omitted from the envelope", () => {
    const credential = basicCredential();
    credential.addSection("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.addSection("contact", { email: "john@example.com" });

    expect(credential.envelope.level).toBeUndefined();
    expect(credential.envelope.kycLevel).toBeUndefined();

    credential.serializeSubject();

    expect(credential.envelope.level).toBe("basic+liveness+email");
    expect(credential.envelope.kycLevel).toBe(1);
  });

  it("derives expirationDate from the document when the caller omits it", () => {
    const credential = new KycV3();
    credential.setEnvelope({ id: "https://issuer.example/credentials/123" });
    credential.setSubject({ id: "uuid:abc" });
    credential.addSection("person", {
      firstName: "John",
      nationality: "US",
      dateOfBirth: new Date("1990-01-01"),
    });
    credential.addSection("idDocument", {
      type: "PASSPORT",
      number: "123456789",
      country: "US",
      dateOfExpiry: new Date("2030-06-01"),
      frontFile: Buffer.from("Front"),
    });

    credential.checkValidity();

    expect(credential.envelope.expirationDate).toEqual(new Date("2030-06-01"));
  });

  it("reaches plus and kycLevel 3 with a verified address, SOW and onboarding", () => {
    const credential = basicCredential();
    credential.addSection("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.addSection("residentialAddress", {
      verified: true,
      street: "Main St",
      city: "New York",
      country: "US",
      proofCategory: "UTILITY_BILL",
      proofDateOfIssue: new Date("2021-01-01"),
      proofFile: Buffer.from("Proof"),
    });
    credential.addSection("sourceOfWealth", { type: "SALARY" });
    credential.addSection("onboarding", {
      intendedUse: "INVESTING",
      employmentStatus: "EMPLOYED",
      expectedMonthlyTransactionCount: "LESS_THAN_5",
      expectedMonthlyTransactionVolume: "MORE_THAN_500_LESS_THAN_2000",
      expectedMonthlyTransactionVolumeCurrency: "EUR",
    });

    expect(credential.level()).toBe("plus+liveness+sow+onboarding");
    expect(credential.kycLevel()).toBe(3);

    expect(credential.publicNotes()).toEqual({
      type: "kyc",
      level: "plus+liveness+sow+onboarding",
      kycLevel: 3,
      proofOfResidency: { category: "UTILITY_BILL", dateOfIssue: new Date("2021-01-01") },
      proofOfIdentity: { type: "PASSPORT", dateOfExpiry: undefined },
    });
  });
});

describe("KycV3 serialization", () => {
  it("flattens every section into the credential subject", () => {
    const credential = new KycV3();

    credential.setEnvelope({
      id: "https://issuer.example/credentials/123",
      issued: new Date("2022-01-01"),
      approvedAt: new Date("2022-01-02"),
      expirationDate: new Date("2030-01-01"),
    });

    credential.setSubject({ id: "uuid:abc" });
    credential.addSection("person", {
      firstName: "John",
      familyName: "Doe",
      gender: "M",
      nationality: "US",
      dateOfBirth: new Date("1990-01-01"),
      placeOfBirth: "New York, NY",
    });
    credential.addSection("idDocument", {
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
    credential.addSection("contact", { email: "john@example.com", phoneNumber: "+1234567890" });
    credential.addSection("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.addSection("residentialAddress", {
      verified: true,
      street: "Main St",
      city: "New York",
      country: "US",
      proofCategory: "UTILITY_BILL",
      proofDateOfIssue: new Date("2021-01-01"),
      proofFile: Buffer.from("Proof"),
      ipCountry: "US",
    });
    credential.addSection("screening", {
      sanctionsCheckResult: "CLEAR",
      sanctionsConfidenceScore: 95,
      pepCheckResult: "NOT_CHECKED",
      pepConfidenceScore: 10,
    });
    credential.addSection("edd", {
      occupation: "REAL_ESTATE",
      sourceOfFundsCategory: "SALARY",
      sourceOfFundsProofFile: Buffer.from("Funds"),
    });
    credential.addSection("sourceOfWealth", {
      type: "SALARY",
      yearlyGrossIncome: "LESS_THAN_20000",
      yearlyGrossIncomeCurrency: "EUR",
      approximateNetWorth: "UP_TO_25000",
      approximateNetWorthCurrency: "EUR",
      sourceOfWealthProofFile: Buffer.from("Proof"),
    });
    credential.addSection("onboarding", {
      intendedUse: "INVESTING",
      employmentStatus: "EMPLOYED",
      expectedMonthlyTransactionCount: "LESS_THAN_5",
      expectedMonthlyTransactionVolume: "MORE_THAN_500_LESS_THAN_2000",
      expectedMonthlyTransactionVolumeCurrency: "EUR",
    });

    const level = "plus+liveness+email+phoneNumber+edd+sow+screening+onboarding";

    expect(credential.level()).toBe(level);
    expect(credential.kycLevel()).toBe(3);

    expect(credential.publicNotes()).toEqual({
      type: "kyc",
      level,
      kycLevel: 3,
      proofOfResidency: { category: "UTILITY_BILL", dateOfIssue: new Date("2021-01-01") },
      proofOfIdentity: { type: "PASSPORT", dateOfExpiry: new Date("2030-01-01") },
    });

    const envelope = credential.serializeEnvelope();
    expect(envelope.level).toBe(level);
    expect(envelope.kycLevel).toBe(3);
    expect(envelope.expirationDate).toBe(new Date("2030-01-01").toISOString());
    expect(envelope.approvedAt).toBe(new Date("2022-01-02").toISOString());

    const serialized = credential.serializeSubject();

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

  it("omits absent optional fields rather than emitting undefined", () => {
    const serialized = basicCredential().serializeSubject();

    expect("personMiddleName" in serialized).toBe(false);
    expect("idDocumentBackFile" in serialized).toBe(false);
    expect("residentialAddressStreet" in serialized).toBe(false);
  });
});

describe("KycV3 deserialization", () => {
  it("deserializes flat envelope and subject fields", async () => {
    const credential = new KycV3();

    await credential.deserialize(
      serializedCredential({
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
      }),
    );

    expect(credential.envelope).toEqual({
      id: "https://issuer.example/credentials/123",
      level: "basic+liveness",
      kycLevel: 1,
      issued: new Date("2022-01-01"),
      approvedAt: new Date("2022-01-02"),
      expirationDate: new Date("2030-01-01"),
    });

    expect(credential.subject.person?.dateOfBirth).toEqual(new Date("1990-01-01"));
    expect(credential.subject.idDocument?.frontFile.toString()).toBe("Front");
    expect(credential.subject.edd?.sourceOfFundsProofFile?.toString()).toBe("Funds");
    expect(credential.subject.onboarding?.employmentStatus).toBe("EMPLOYED");
    expect(credential.subject.onboarding?.expectedMonthlyTransactionCount).toBe("LESS_THAN_5");

    // Sections absent from the wire stay absent rather than becoming empty objects.
    expect(credential.subject.biometric).toBeUndefined();
    expect(credential.subject.screening).toBeUndefined();
  });

  it("round-trips an unverified address", async () => {
    const credential = basicCredential();
    credential.addSection("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
    credential.addSection("residentialAddress", {
      verified: false,
      street: "Oak Ave",
      houseNumber: "42",
      city: "Boston",
      postalCode: "02108",
      country: "US",
    });

    expect(credential.level()).toBe("basic+liveness");
    expect(credential.kycLevel()).toBe(1);

    const serialized = credential.serializeSubject();
    expect(serialized.residentialAddressVerified).toBe(false);
    expect("residentialAddressProofCategory" in serialized).toBe(false);
    expect("residentialAddressProofFile" in serialized).toBe(false);

    const roundTrip = new KycV3();
    await roundTrip.deserialize(serializedCredential(serialized));

    expect(roundTrip.subject.residentialAddress).toEqual({
      verified: false,
      street: "Oak Ave",
      houseNumber: "42",
      city: "Boston",
      postalCode: "02108",
      country: "US",
    });
  });

  it("rejects a wire key the subject does not declare", async () => {
    await expect(
      new KycV3().deserialize(
        serializedCredential({
          "@context": ["https://example.com/whatever"],
          id: "uuid:abc",
          personFirstName: "John",
          personNationality: "US",
          personDateOfBirth: new Date("1990-01-01").toISOString(),
          idDocumentType: "PASSPORT",
          idDocumentNumber: "123456789",
          idDocumentCountry: "US",
          idDocumentFrontFile: fileToBase85(Buffer.from("Front")),
          unexpectedJsonLdField: "breaks-json-ld",
        }),
      ),
    ).rejects.toThrow("Unexpected subject fields: unexpectedJsonLdField");
  });

  it("drops the credential's own keys rather than reading them as fields", async () => {
    const credential = new KycV3();

    await credential.deserialize(
      serializedCredential({
        "@context": ["https://example.com/whatever"],
        id: "uuid:abc",
        personFirstName: "John",
        personNationality: "US",
        personDateOfBirth: new Date("1990-01-01").toISOString(),
        idDocumentType: "PASSPORT",
        idDocumentNumber: "123456789",
        idDocumentCountry: "US",
        idDocumentFrontFile: fileToBase85(Buffer.from("Front")),
      }),
    );

    // The subject's `@context` is accepted, but is not one of its fields.
    expect(credential.subject).not.toHaveProperty("@context");
    expect(credential.envelope).not.toHaveProperty("proof");
    expect(credential.envelope).not.toHaveProperty("issuanceDate");
    expect(credential.envelope).not.toHaveProperty("@context");
  });

  it("reports a file that is not valid ascii85 instead of silently dropping it", async () => {
    const credential = new KycV3();

    await credential.deserialize(
      serializedCredential({
        id: "uuid:abc",
        personFirstName: "John",
        personNationality: "US",
        personDateOfBirth: new Date("1990-01-01").toISOString(),
        idDocumentType: "PASSPORT",
        idDocumentNumber: "123456789",
        idDocumentCountry: "US",
        idDocumentFrontFile: "not-ascii85",
      }),
    );

    expect(() => credential.checkValidity()).toThrow(/frontFile/);
  });
});
