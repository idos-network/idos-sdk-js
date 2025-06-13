import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { buildCredentials } from "./builder";
import { verifyCredentials } from "./verifier";

describe("verifiableCredentials", () => {
  it("should raise an error if the fields are invalid", async () => {
    expect.assertions(8); // catch

    const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
    const issuer = "https://vc-issuers.cool.id/idos";

    const validKey = await Ed25519VerificationKey2020.generate({
      id: `${issuer}/keys/1`,
      controller: `${issuer}/issuers/1`,
    });

    try {
      await buildCredentials(
        {
          id: `${issuer}/credentials/${id}`,
          level: "human",
          issued: new Date("2022-01-01"),
          approvedAt: new Date("2022-01-01"),
          expirationDate: new Date("2030-01-01"),
        },
        // @ts-expect-error - This is a test
        {
          id: `uuid:${id}`,
          applicantId: "1234567890",
          firstName: "John",
          familyName: "Lennon",
          governmentIdType: "SSN",
          governmentId: "123-45-6789",
          email: "john.lennon@example.com",
          phoneNumber: "+1234567890",
          dateOfBirth: new Date("2025-02-30"),
          placeOfBirth: "New York, NY",
          idDocumentCountry: "DEU",
          idDocumentNumber: "123456789",
          idDocumentType: "PASSPORT",
          idDocumentDateOfIssue: new Date("2022-01-01"),
          idDocumentDateOfExpiry: new Date("2025-01-01"),
          idDocumentFrontFile: Buffer.from("Front of ID document"),
          residentialAddress: {
            street: "Main St",
            houseNumber: "123",
            additionalAddressInfo: "Apt 1",
            city: "New York",
            postalCode: "10001",
            country: "USA",
          },
          residentialAddressProofCategory: "Utility Bill",
          residentialAddressProofDateOfIssue: new Date("2022-01-01"),
          residentialAddressProofFile: Buffer.from("Proof of address"),
        },
        validKey,
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const zodError = error as ZodError;
      expect(zodError.errors).toHaveLength(3);

      // idDocumentCountry
      const idDocumentCountryError = zodError.errors.find(
        (error) => error.path[0] === "idDocumentCountry",
      );
      expect(idDocumentCountryError).toBeDefined();
      expect(idDocumentCountryError?.message).toContain(
        "String must contain at most 2 character(s)",
      );

      // selfieFile
      const selfieFileError = zodError.errors.find((error) => error.path[0] === "selfieFile");
      expect(selfieFileError).toBeDefined();
      expect(selfieFileError?.message).toContain("Input not instance of Buffer");

      // residentialAddress country
      const residentialAddressCountryError = zodError.errors.find(
        (error) => error.path[0] === "residentialAddress",
      );
      expect(residentialAddressCountryError).toBeDefined();
      expect(residentialAddressCountryError?.message).toContain(
        "String must contain at most 2 character(s)",
      );
    }
  });

  it("should create and verify a verifiable vc", async () => {
    const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
    const issuer = "https://vc-issuers.cool.id/idos";
    const issuer2 = "https://vc-issuers.cool.id/idos2";

    const validKey = await Ed25519VerificationKey2020.generate({
      id: `${issuer}/keys/1`,
      controller: `${issuer}/issuers/1`,
    });

    const anotherKey = await Ed25519VerificationKey2020.generate({
      id: `${issuer2}/keys/1`,
      controller: `${issuer2}/issuers/1`,
    });

    const data = await buildCredentials(
      {
        id: `${issuer}/credentials/${id}`,
        level: "human",
        issued: new Date("2022-01-01"),
        approvedAt: new Date("2022-01-01"),
        expirationDate: new Date("2030-01-01"),
      },
      {
        id: `uuid:${id}`,
        applicantId: "1234567890",
        firstName: "John",
        familyName: "Lennon",
        governmentIdType: "SSN",
        governmentId: "123-45-6789",
        email: "john.lennon@example.com",
        phoneNumber: "+1234567890",
        dateOfBirth: new Date("1980-01-01"),
        placeOfBirth: "New York, NY",
        idDocumentCountry: "US",
        idDocumentNumber: "123456789",
        idDocumentType: "PASSPORT",
        idDocumentDateOfIssue: new Date("2022-01-01"),
        idDocumentDateOfExpiry: new Date("2025-01-01"),
        idDocumentFrontFile: Buffer.from("Front of ID document"),
        idDocumentBackFile: Buffer.from("Back of ID document"),
        selfieFile: Buffer.from("Selfie"),
        residentialAddress: {
          street: "Main St",
          houseNumber: "123",
          additionalAddressInfo: "Apt 1",
          city: "New York",
          postalCode: "10001",
          country: "US",
        },
        residentialAddressProofCategory: "Utility Bill",
        residentialAddressProofDateOfIssue: new Date("2022-01-01"),
        residentialAddressProofFile: Buffer.from("Proof of address"),
      },
      validKey,
    );

    // Check if residential address is properly prefixed
    expect(data.credentialSubject.residentialAddressStreet).toBe("Main St");
    expect(data.credentialSubject.residentialAddressHouseNumber).toBe("123");
    expect(data.credentialSubject.residentialAddressAdditionalAddressInfo).toBe("Apt 1");
    expect(data.credentialSubject.residentialAddressCity).toBe("New York");
    expect(data.credentialSubject.residentialAddressPostalCode).toBe("10001");
    expect(data.credentialSubject.residentialAddressCountry).toBe("US");

    expect(data.credentialSubject.email).toBe("john.lennon@example.com");
    expect(data.credentialSubject.phoneNumber).toBe("+1234567890");

    // Check if proof is properly constructed
    expect(data.proof.proofPurpose).toBe("assertionMethod");
    expect(data.proof.type).toBe("Ed25519Signature2020");
    expect(data.proof.verificationMethod).toBe("https://vc-issuers.cool.id/idos/keys/1");

    const allowedIssuers = [anotherKey, validKey];

    const verified = await verifyCredentials(data, allowedIssuers);
    expect(verified).toBe(true);

    // Invalid issuer
    const invalidIssuers = [
      {
        // Just the wrong issuer
        issuer: issuer2,
        publicKeyMultibase: anotherKey.publicKeyMultibase,
      },
    ];

    const invalidVerified = await verifyCredentials(data, invalidIssuers);
    expect(invalidVerified).toBe(false);

    // Accepts issuer as issuer object
    const validIssuer = [
      {
        issuer,
        publicKeyMultibase: validKey.publicKeyMultibase,
      },
    ];

    const validIssuerVerified = await verifyCredentials(data, validIssuer);
    expect(validIssuerVerified).toBe(true);
  });
});
