import { describe, expect, it } from "vitest";

import { base85ToFile } from "../../../utils";
import { VerifiableCredentialKycV1 } from "./index";

describe("VerifiableCredentialKycV1", () => {
  it("is valid with required fields", () => {
    const credential = new VerifiableCredentialKycV1();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      level: "human",
      approvedAt: new Date("2022-01-01"),
    });
    credential.setMandatoryFields({ id: "uuid:abc" });

    expect(() => credential.checkValidity()).not.toThrow();
  });

  it("serializes KYC v1 sections into the credential subject", () => {
    const credential = new VerifiableCredentialKycV1();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      level: "human",
      approvedAt: new Date("2022-01-01"),
    });
    credential.setMandatoryFields({
      id: "uuid:abc",
      firstName: "Ada",
      familyName: "Lovelace",
      nationality: "GB",
      dateOfBirth: new Date("1815-12-10"),
      selfieFile: Buffer.from("Selfie"),
    });
    credential.addIdDocument({
      country: "GB",
      number: "123456789",
      type: "PASSPORT",
      dateOfIssue: new Date("2020-01-01"),
      frontFile: Buffer.from("Front"),
    });
    credential.addResidentialAddress({
      street: "Main St",
      city: "London",
      country: "GB",
      proofCategory: "UTILITY_BILL",
      proofFile: Buffer.from("Proof"),
    });

    const serialized = credential.serialize() as Record<string, unknown>;

    expect(serialized["@context"]).toEqual([
      "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v1.json",
    ]);
    expect(serialized.id).toBe("uuid:abc");
    expect(serialized.firstName).toBe("Ada");
    expect(serialized.dateOfBirth).toBe(new Date("1815-12-10").toISOString());
    expect(base85ToFile(serialized.selfieFile as string)?.toString()).toBe("Selfie");
    expect(serialized.idDocumentCountry).toBe("GB");
    expect(base85ToFile(serialized.idDocumentFrontFile as string)?.toString()).toBe("Front");
    expect(serialized.residentialAddressCity).toBe("London");
    expect(base85ToFile(serialized.residentialAddressProofFile as string)?.toString()).toBe(
      "Proof",
    );
  });
});
