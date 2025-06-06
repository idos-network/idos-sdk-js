import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { describe, expect, it } from "vitest";
import { buildCredentials } from "./builder";
import { verifyCredentials } from "./verifier";

describe("verifiableCredentials", () => {
  it("should create and verify a verifiable vc", async () => {
    const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
    const issuer = "https://vc-issuers.cool.id/idos";
    const issuer2 = "https://vc-issuers.cool.id/idos2";

    const validKey = await Ed25519VerificationKey2020.generate({
      id: `${issuer}/keys/1`,
      controller: `${issuer}/issuer/1`,
    });

    const anotherKey = await Ed25519VerificationKey2020.generate({
      id: `${issuer2}/keys/1`,
      controller: `${issuer2}/issuer/1`,
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
        dateOfBirth: new Date("1980-01-01"),
        placeOfBirth: "New York, NY",
        idDocumentCountry: "US",
        idDocumentNumber: "123456789",
        idDocumentType: "Passport",
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

    // Check if proof is properly constructed
    expect(data.proof.proofPurpose).toBe("assertionMethod");
    expect(data.proof.type).toBe("Ed25519Signature2020");
    expect(data.proof.verificationMethod).toBe("https://vc-issuers.cool.id/idos/keys/1");

    const allowedIssuers = [
      {
        // This one the right one
        issuer: issuer2,
        publicKeyMultibase: anotherKey.publicKeyMultibase,
      },
      {
        // This one is valid
        issuer,
        publicKeyMultibase: validKey.publicKeyMultibase,
      },
    ];

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
  });
});
