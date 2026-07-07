import { base85ToFile } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";

import { VerifiableCredentialEddV1 } from "./index";

describe("VerifiableCredentialEddV1", () => {
  it("is valid with required fields", () => {
    const credential = new VerifiableCredentialEddV1();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/edd1-123",
    });
    credential.setMandatoryFields({
      id: "https://issuer.example/credentials/edd1-123",
    });
    credential.add("edd", {
      occupation: "AGRICULTURE",
      sourceOfFundsCategory: "BUSINESS_OWNER",
      sourceOfFundsProofFile: new Buffer("proof of source of funds"),
    });

    expect(() => credential.checkValidity()).not.toThrow();
  });

  it("serializes EDD v1 fields into the credential subject", () => {
    const credential = new VerifiableCredentialEddV1();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/edd1-123",
    });
    credential.setMandatoryFields({
      id: "https://issuer.example/credentials/edd1-123",
    });
    credential.add("edd", {
      occupation: "AGRICULTURE",
      sourceOfFundsCategory: "BUSINESS_OWNER",
      sourceOfFundsProofFile: new Buffer("proof of source of funds"),
    });

    const serialized = credential.serializeSubject() as Record<string, unknown>;

    expect(serialized["@context"]).toEqual([
      "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-edd-v1.json",
    ]);
    expect(serialized.eddOccupation).toBe("AGRICULTURE");
    expect(serialized.eddSourceOfFundsCategory).toBe("BUSINESS_OWNER");
    expect(base85ToFile(serialized.eddSourceOfFundsProofFile as string)).toStrictEqual(
      Buffer.from("proof of source of funds"),
    );
  });

  it("EDD v1 public notes", () => {
    const credential = new VerifiableCredentialEddV1();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/edd1-123",
    });

    credential.setMandatoryFields({
      id: "https://issuer.example/credentials/edd1-123",
    });

    credential.add("edd", {
      occupation: "AGRICULTURE",
      sourceOfFundsCategory: "BUSINESS_OWNER",
      sourceOfFundsProofFile: new Buffer("proof of source of funds"),
    });

    const publicNotes = credential.publicNotes();

    expect(publicNotes).toBeDefined();
    expect(publicNotes).toMatchObject({
      type: "edd",
      level: "edd",
    });
  });
});
