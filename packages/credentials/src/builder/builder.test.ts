import crypto from "node:crypto";
import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { fileToBase85 } from "../utils";
import { buildCredential, buildFaceIdCredential } from ".";
import { verifyCredential } from "./verifier";

describe("verifiableCredentials", () => {
  describe("face-scan-id", () => {
    it("should raise an error if the fields are invalid", async () => {
      expect.assertions(4); // catch

      const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
      const issuer = "https://vc-issuers.cool.id/idos";

      const validKey = await Ed25519VerificationKey2020.generate({
        id: `${issuer}/keys/1`,
        controller: `${issuer}/issuers/1`,
      });

      try {
        await buildFaceIdCredential(
          {
            id: `${issuer}/credentials/${id}`,
            level: "human",
            issued: new Date("2022-01-01"),
            approvedAt: new Date("2022-01-01"),
            expirationDate: new Date("2030-01-01"),
          },
          {
            // @ts-expect-error
            id: `uuid:${id}`,
          },
          validKey,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.issues).toHaveLength(1);

        const faceSignUserId = zodError.issues.find((error) => error.path[0] === "faceSignUserId");
        expect(faceSignUserId).toBeDefined();
        expect(faceSignUserId?.message).toContain(
          "Invalid input: expected string, received undefined",
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

      const faceSignUserId = crypto.randomUUID();

      const data = await buildFaceIdCredential(
        {
          id: `${issuer}/credentials/${id}`,
          level: "human",
          issued: new Date("2022-01-01"),
          approvedAt: new Date("2022-01-01"),
          expirationDate: new Date("2030-01-01"),
        },
        {
          faceSignUserId,
        },
        validKey,
      );

      // Check if residential address is properly prefixed
      expect(data.credentialSubject.faceSignUserId).toBe(faceSignUserId);

      // Check if proof is properly constructed
      expect(data.proof.proofPurpose).toBe("assertionMethod");
      expect(data.proof.type).toBe("Ed25519Signature2020");
      expect(data.proof.verificationMethod).toBe("https://vc-issuers.cool.id/idos/keys/1");

      const allowedIssuers = [anotherKey, validKey];

      const [verified, validResults] = await verifyCredential(data, allowedIssuers);
      expect(verified).toBe(true);

      const validResultsArray = validResults.values().toArray();
      expect(validResultsArray).toHaveLength(2);
      expect(validResultsArray[0].verified).toBe(false);
      expect(validResultsArray[1].verified).toBe(true);
    });

    it("tempered VCs will be rejected", async () => {
      const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
      const issuer = "https://vc-issuers.cool.id/idos";

      const validKey = await Ed25519VerificationKey2020.generate({
        id: `${issuer}/keys/1`,
        controller: `${issuer}/issuers/1`,
      });

      const faceSignUserId = crypto.randomUUID();
      const faceSignUserId2 = crypto.randomUUID();

      const data = await buildFaceIdCredential(
        {
          id: `${issuer}/credentials/${id}`,
          level: "human",
          issued: new Date("2022-01-01"),
          approvedAt: new Date("2022-01-01"),
          expirationDate: new Date("2030-01-01"),
        },
        {
          faceSignUserId,
        },
        validKey,
      );

      // Check validity
      const allowedIssuers = [validKey];
      const [verified] = await verifyCredential(data, allowedIssuers);
      expect(verified).toBe(true);

      // Modify data
      data.credentialSubject.faceSignUserId = faceSignUserId2;
      const [verified2] = await verifyCredential(data, allowedIssuers);
      expect(verified2).toBe(false);
    });
  });

  describe("credentials", () => {
    it("should raise an error if the fields are invalid", async () => {
      expect.assertions(12); // catch

      const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
      const issuer = "https://vc-issuers.cool.id/idos";

      const validKey = await Ed25519VerificationKey2020.generate({
        id: `${issuer}/keys/1`,
        controller: `${issuer}/issuers/1`,
      });

      try {
        await buildCredential(
          {
            id: `${issuer}/credentials/${id}`,
            level: "human",
            issued: new Date("2022-01-01"),
            approvedAt: new Date("2022-01-01"),
            expirationDate: new Date("2030-01-01"),
          },
          {
            id: `uuid:${id}`,
            firstName: "John",
            familyName: "Lennon",
            // @ts-expect-error - This is a test, so the error is expected, since data is invalid
            gender: "MALE",
            email: "john.lennon@example.com",
            phoneNumber: "+1234567890",
            ssn: "203-456",
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
              proofCategory: "Utility Bill",
              proofDateOfIssue: new Date("2022-01-01"),
              proofFile: Buffer.from("Proof of address"),
            },
          },
          validKey,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.issues).toHaveLength(5);

        // idDocumentCountry
        const idDocumentCountryError = zodError.issues.find(
          (error) => error.path[0] === "idDocumentCountry",
        );
        expect(idDocumentCountryError).toBeDefined();
        expect(idDocumentCountryError?.message).toContain(
          "Too big: expected string to have <=2 characters",
        );

        // selfieFile
        const selfieFileError = zodError.issues.find((error) => error.path[0] === "selfieFile");
        expect(selfieFileError).toBeDefined();
        expect(selfieFileError?.message).toContain("expected Buffer, received undefined");

        // residentialAddress country
        const residentialAddressCountryError = zodError.issues.find(
          (error) => error.path[0] === "residentialAddress",
        );
        expect(residentialAddressCountryError).toBeDefined();
        expect(residentialAddressCountryError?.message).toContain(
          "Too big: expected string to have <=2 characters",
        );

        // gender
        const genderError = zodError.issues.find((error) => error.path[0] === "gender");
        expect(genderError).toBeDefined();
        expect(genderError?.message).toContain('Invalid option: expected one of "M"|"F"|"OTHER"');

        // ssn
        const ssnError = zodError.issues.find((error) => error.path[0] === "ssn");
        expect(ssnError).toBeDefined();
        expect(ssnError?.message).toContain("Too small: expected string to have >=9 characters");
      }
    });

    it("test refinement (at least one of firstName or familyName must be provided)", async () => {
      const id = "z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3";
      const issuer = "https://vc-issuers.cool.id/idos";

      const validKey = await Ed25519VerificationKey2020.generate({
        id: `${issuer}/keys/1`,
        controller: `${issuer}/issuers/1`,
      });

      expect.assertions(3); // catch

      try {
        await buildCredential(
          {
            id: `${issuer}/credentials/${id}`,
            level: "human",
            issued: new Date("2022-01-01"),
            approvedAt: new Date("2022-01-01"),
            expirationDate: new Date("2030-01-01"),
          },
          {
            id: `uuid:${id}`,
            ssn: "123456789",
            firstName: "",
            familyName: undefined,
            gender: "M",
            nationality: "US",
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
          },
          validKey,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.issues).toHaveLength(1);

        const refinementError = zodError.issues.find(
          (error) => error.message === "At least one of firstName or familyName must be provided",
        );
        expect(refinementError).toBeDefined();
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

      const data = await buildCredential(
        {
          id: `${issuer}/credentials/${id}`,
          level: "human",
          issued: new Date("2022-01-01"),
          approvedAt: new Date("2022-01-01"),
          expirationDate: new Date("2030-01-01"),
        },
        {
          id: `uuid:${id}`,
          firstName: "John",
          middleName: "Paul",
          familyName: "Lennon",
          ssn: "123456789",
          gender: "M",
          nationality: "US",
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
            region: "NY",
            city: "New York",
            postalCode: "10001",
            country: "US",
            proofCategory: "Utility Bill",
            proofDateOfIssue: new Date("2022-01-01"),
            proofFile: Buffer.from("Proof of address"),
          },
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
      expect(data.credentialSubject.residentialAddressRegion).toBe("NY");
      expect(data.credentialSubject.residentialAddressProofCategory).toBe("Utility Bill");
      expect(data.credentialSubject.residentialAddressProofDateOfIssue).toEqual(
        new Date("2022-01-01").toISOString(),
      );
      expect(data.credentialSubject.residentialAddressProofFile).toEqual(
        fileToBase85(Buffer.from("Proof of address")),
      );

      expect(data.credentialSubject.email).toBe("john.lennon@example.com");
      expect(data.credentialSubject.phoneNumber).toBe("+1234567890");

      // Check if proof is properly constructed
      expect(data.proof.proofPurpose).toBe("assertionMethod");
      expect(data.proof.type).toBe("Ed25519Signature2020");
      expect(data.proof.verificationMethod).toBe("https://vc-issuers.cool.id/idos/keys/1");

      const allowedIssuers = [anotherKey, validKey];

      const [verified, validResults] = await verifyCredential(data, allowedIssuers);
      expect(verified).toBe(true);

      const validResultsArray = validResults.values().toArray();
      expect(validResultsArray).toHaveLength(2);
      expect(validResultsArray[0].verified).toBe(false);
      expect(validResultsArray[1].verified).toBe(true);

      // Invalid issuer
      const invalidIssuers = [
        {
          // Just the wrong issuer
          issuer: issuer2,
          publicKeyMultibase: anotherKey.publicKeyMultibase,
        },
      ];

      const [invalidVerified, invalidResults] = await verifyCredential(data, invalidIssuers);
      expect(invalidVerified).toBe(false);

      const invalidResultsArray = invalidResults.values().toArray();
      expect(invalidResultsArray).toHaveLength(1);
      expect(invalidResultsArray[0].verified).toBe(false);
      expect(invalidResultsArray[0].error?.errors?.[0]?.message).toContain("not verify any proofs");

      // Accepts issuer as issuer object
      const validIssuer = [
        {
          issuer,
          publicKeyMultibase: validKey.publicKeyMultibase,
        },
      ];

      const [validIssuerVerified] = await verifyCredential(data, validIssuer);
      expect(validIssuerVerified).toBe(true);
    });
  });
});
