import { describe, expect, it } from "vitest";

import { base85ToFile } from "../../../utils";
import { VerifiableCredentialKycV2 } from "./index";

const envelopeFields = {
  id: "https://issuer.example/credentials/123",
  level: "human",
  kycLevel: 1,
  issued: new Date("2022-01-01").toISOString(),
  approvedAt: new Date("2022-01-02").toISOString(),
  expirationDate: new Date("2030-01-01").toISOString(),
};

describe("VerifiableCredentialKycV2", () => {
  it("is valid with required fields", () => {
    const credential = new VerifiableCredentialKycV2();

    credential.setMandatoryEnvelopeFields(envelopeFields);
    credential.setMandatoryFields({ id: "uuid:abc" });

    expect(() => credential.checkValidity()).not.toThrow();
  });

  it("serializes KYC v2 sections into the credential subject", () => {
    const credential = new VerifiableCredentialKycV2();

    credential.setMandatoryEnvelopeFields(envelopeFields);
    credential.setMandatoryFields({
      id: "uuid:abc",
      firstName: "Grace",
      familyName: "Hopper",
      nationality: "US",
      dateOfBirth: new Date("1906-12-09"),
      selfieFile: Buffer.from("Selfie"),
    });
    credential.addIdDocument({
      country: "US",
      number: "123456789",
      type: "PASSPORT",
      dateOfIssue: new Date("2020-01-01"),
      frontFile: Buffer.from("Front"),
    });
    credential.addResidentialAddress({
      street: "Main St",
      city: "Arlington",
      country: "US",
      proofCategory: "UTILITY_BILL",
      proofFile: Buffer.from("Proof"),
    });

    const serialized = credential.serialize() as Record<string, unknown>;

    expect(serialized["@context"]).toEqual([
      "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-v2.json",
    ]);
    expect(serialized.id).toBe("uuid:abc");
    expect(serialized.firstName).toBe("Grace");
    expect(serialized.dateOfBirth).toBe(new Date("1906-12-09").toISOString());
    expect(base85ToFile(serialized.selfieFile as string)?.toString()).toBe("Selfie");
    expect(serialized.idDocumentCountry).toBe("US");
    expect(base85ToFile(serialized.idDocumentFrontFile as string)?.toString()).toBe("Front");
    expect(serialized.residentialAddressCity).toBe("Arlington");
    expect(base85ToFile(serialized.residentialAddressProofFile as string)?.toString()).toBe(
      "Proof",
    );
  });
});
