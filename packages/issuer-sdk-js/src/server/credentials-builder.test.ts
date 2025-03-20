import { describe, expect, it } from "vitest";

import { buildCredentials } from "./credentials-builder";

describe("buildVerifiableCredentials", () => {
  it("should create a verifiable vc", async () => {
    const data = await buildCredentials(
      {
        id: "did:example:1234#z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3",
        level: "human",
        issued: new Date("2022-01-01"),
        approvedAt: new Date("2022-01-01"),
        expirationDate: new Date("2025-01-01"),
      },
      {
        id: "did:example:1234#z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3",
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
      {
        name: "https://vc-issuers.next.fractal.id/idos",
        publicKeyMultibase: "z6MkrQDe6W8yspNAZyVXw9Rt9s8FuP61y9XRnRhA2kbQ1Jyj",
        privateKeyMultibase:
          "zrv4XwF1S61SJuUjQpaAPCoM7QJiw8J3EDFPQ4AGN5D3r3iaR8mcSeJZoYjSWe6PqgSfwtC3KPvAvHQ7QxGeNp9rZ2m",
      },
    );

    expect(data.credentialSubject.residentialAddressStreet).toBe("Main St");
    expect(data.credentialSubject.residentialAddressHouseNumber).toBe("123");
    expect(data.credentialSubject.residentialAddressAdditionalAddressInfo).toBe("Apt 1");
    expect(data.credentialSubject.residentialAddressCity).toBe("New York");
    expect(data.credentialSubject.residentialAddressPostalCode).toBe("10001");
    expect(data.credentialSubject.residentialAddressCountry).toBe("US");

    expect(data.proof.proofPurpose).toBe("assertionMethod");
    expect(data.proof.type).toBe("Ed25519Signature2020");
    expect(data.proof.verificationMethod).toBe(
      "https://vc-issuers.next.fractal.id/idos#z6MkrQDe6W8yspNAZyVXw9Rt9s8FuP61y9XRnRhA2kbQ1Jyj",
    );
  });
});