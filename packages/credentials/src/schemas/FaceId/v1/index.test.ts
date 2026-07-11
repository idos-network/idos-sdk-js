import { describe, expect, it } from "vitest";

import { VerifiableCredentialFaceIdV1 } from "./index";

describe("VerifiableCredentialFaceIdV1", () => {
  it("is valid with required fields", () => {
    const credential = new VerifiableCredentialFaceIdV1();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      level: "human",
      approvedAt: new Date("2022-01-01"),
    });
    credential.setMandatoryFields({ faceSignUserId: "11111111-1111-1111-1111-111111111111" });

    expect(() => credential.checkValidity()).not.toThrow();
  });

  it("serializes FaceId v1 fields into the credential subject", () => {
    const credential = new VerifiableCredentialFaceIdV1();

    credential.setMandatoryEnvelopeFields({
      id: "https://issuer.example/credentials/123",
      level: "human",
      approvedAt: new Date("2022-01-01"),
    });
    credential.setMandatoryFields({ faceSignUserId: "11111111-1111-1111-1111-111111111111" });

    const serialized = credential.serialize() as Record<string, unknown>;

    expect(serialized["@context"]).toEqual([
      "https://idos-network.github.io/idos-sdk-js/credentials/idos-credential-subject-face-id-v1.json",
    ]);
    expect(serialized.faceSignUserId).toBe("11111111-1111-1111-1111-111111111111");
  });
});
