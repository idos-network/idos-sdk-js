import { base85ToFile, fileToBase85 } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";

import type { VerifiableCredential } from "../../types";

import { KycV1 } from "./index";

function serializedCredential(
  credentialSubject: Record<string, unknown>,
): VerifiableCredential<unknown> {
  return {
    "@context": [],
    type: ["VerifiableCredential"],
    issuer: "did:example:issuer",
    id: "https://issuer.example/credentials/123",
    level: "basic",
    approvedAt: new Date("2022-01-01").toISOString(),
    issuanceDate: new Date("2022-01-01").toISOString(),
    credentialSubject,
    proof: { type: "Ed25519Signature2020", proofValue: "proof" },
  } as unknown as VerifiableCredential<unknown>;
}

describe("KycV1", () => {
  it("is valid with only the ids set", () => {
    const credential = new KycV1()
      .setEnvelope({ id: "https://issuer.example/credentials/123" })
      .setSubject({ id: "uuid:abc" });

    expect(() => credential.checkValidity()).not.toThrow();
  });

  it("derives level from the subject, reaching plus on a complete address proof", () => {
    const credential = new KycV1().setSubject({
      id: "uuid:abc",
      email: "ada@example.com",
      selfieFile: Buffer.from("Selfie"),
    });

    expect(credential.level()).toBe("basic+liveness+email");

    credential.addSection("residentialAddress", {
      city: "London",
      proofFile: Buffer.from("Proof"),
    });
    expect(credential.level()).toBe("basic+liveness+email");

    credential.addSection("residentialAddress", {
      city: "London",
      country: "GB",
      proofCategory: "UTILITY_BILL",
      proofFile: Buffer.from("Proof"),
    });
    expect(credential.level()).toBe("plus+liveness+email");
    expect(credential.publicNotes()).toEqual({ type: "kyc", level: "plus+liveness+email" });
  });

  it("flattens the subject, keeping its own fields unprefixed", () => {
    const credential = new KycV1()
      .setEnvelope({
        id: "https://issuer.example/credentials/123",
        approvedAt: new Date("2022-01-01"),
      })
      .setSubject({
        id: "uuid:abc",
        firstName: "Ada",
        familyName: "Lovelace",
        nationality: "GB",
        dateOfBirth: new Date("1815-12-10"),
        selfieFile: Buffer.from("Selfie"),
      })
      .addSection("idDocument", {
        country: "GB",
        number: "123456789",
        type: "PASSPORT",
        dateOfIssue: new Date("2020-01-01"),
        frontFile: Buffer.from("Front"),
      })
      .addSection("residentialAddress", {
        street: "Main St",
        city: "London",
        country: "GB",
        proofCategory: "UTILITY_BILL",
        proofFile: Buffer.from("Proof"),
      });

    const serialized = credential.serializeSubject();

    expect(serialized.id).toBe("uuid:abc");
    expect(serialized.firstName).toBe("Ada");
    expect(serialized.dateOfBirth).toBe(new Date("1815-12-10").toISOString());
    expect(base85ToFile(serialized.selfieFile as string)?.toString()).toBe("Selfie");
    expect(serialized.idDocumentCountry).toBe("GB");
    expect(serialized.idDocumentDateOfIssue).toBe(new Date("2020-01-01").toISOString());
    expect(base85ToFile(serialized.idDocumentFrontFile as string)?.toString()).toBe("Front");
    expect(serialized.residentialAddressCity).toBe("London");
    expect(base85ToFile(serialized.residentialAddressProofFile as string)?.toString()).toBe(
      "Proof",
    );

    expect("middleName" in serialized).toBe(false);
    expect("idDocumentBackFile" in serialized).toBe(false);
  });

  it("round-trips through deserialize", async () => {
    const roundTrip = new KycV1();

    await roundTrip.deserialize(
      serializedCredential({
        id: "uuid:abc",
        firstName: "Ada",
        dateOfBirth: new Date("1815-12-10").toISOString(),
        selfieFile: fileToBase85(Buffer.from("Selfie")),
        idDocumentType: "PASSPORT",
        residentialAddressCity: "London",
      }),
    );

    expect(roundTrip.subject.id).toBe("uuid:abc");
    expect(roundTrip.subject.dateOfBirth).toEqual(new Date("1815-12-10"));
    expect(roundTrip.subject.selfieFile?.toString()).toBe("Selfie");
    expect(roundTrip.subject.idDocument?.type).toBe("PASSPORT");
    expect(roundTrip.subject.residentialAddress?.city).toBe("London");
    expect(roundTrip.envelope.approvedAt).toEqual(new Date("2022-01-01"));
  });

  it("rejects fields the subject does not declare", async () => {
    expect(() => new KycV1().setSubject({ id: "x", bogus: 1 } as never)).toThrow(
      "Unexpected subject fields: bogus",
    );

    expect(() => new KycV1().addSection("idDocument", { bogus: 1 } as never)).toThrow(
      "Unexpected idDocument fields: bogus",
    );

    await expect(
      new KycV1().deserialize(serializedCredential({ id: "uuid:abc", bogus: 1 })),
    ).rejects.toThrow("Unexpected subject fields: bogus");
  });

  it("keeps the applicant and government-id fields v2 dropped", () => {
    const serialized = new KycV1()
      .setEnvelope({ id: "https://issuer.example/credentials/123" })
      .setSubject({
        id: "uuid:abc",
        applicantId: "applicant-1",
        inquiryId: "inquiry-1",
        governmentId: "gov-1",
        governmentIdType: "NATIONAL_ID",
      })
      .serializeSubject();

    expect(serialized.applicantId).toBe("applicant-1");
    expect(serialized.governmentIdType).toBe("NATIONAL_ID");
  });
});
