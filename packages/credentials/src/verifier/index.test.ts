import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyCredential } from ".";
import { VerifiableCredentialFaceIdV1, VerifiableCredentialKycV3 } from "../schemas";

const ISSUER = "https://vc-issuers.cool.id/idos";
const ISSUER2 = "https://vc-issuers.cool.id/idos2";
const CRED_ID = `${ISSUER}/credentials/z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3`;
const ISSUED = new Date("2022-01-01");
const APPROVED_AT = new Date("2022-01-02");
const EXPIRATION_DATE = new Date("2030-01-01");

/** The flat credential subject of a signed credential, which `issue()` types as unknown. */
function subjectOf(credential: { credentialSubject: unknown }): Record<string, unknown> {
  return credential.credentialSubject as Record<string, unknown>;
}

function generateKey(issuer: string) {
  return Ed25519VerificationKey2020.generate({
    id: `${issuer}/keys/1`,
    controller: `${issuer}/issuers/1`,
  });
}

async function issueFaceId(key: Ed25519VerificationKey2020) {
  const credential = new VerifiableCredentialFaceIdV1();
  credential.setEnvelope({ id: CRED_ID });
  credential.setSubject({ faceSignUserId: crypto.randomUUID() });
  return credential.issue(key);
}

async function issueKycV3(key: Ed25519VerificationKey2020) {
  const credential = new VerifiableCredentialKycV3();
  credential.setEnvelope({
    id: CRED_ID,
    issued: ISSUED,
    approvedAt: APPROVED_AT,
    expirationDate: EXPIRATION_DATE,
  });
  credential.setSubject({ id: "uuid:abc" });
  credential.addSection("person", {
    firstName: "John",
    familyName: "Lennon",
    nationality: "US",
    dateOfBirth: new Date("1980-01-01"),
  });
  credential.addSection("idDocument", {
    type: "PASSPORT",
    number: "123456789",
    country: "US",
    frontFile: Buffer.from("Front"),
  });
  credential.addSection("biometric", { selfieFile: Buffer.from("Selfie"), selfieMatch: 99 });
  return credential.issue(key);
}

describe("issue + verifyCredential round-trip", () => {
  it("issues a signed FaceId v1 credential that verifies against its issuer", async () => {
    const validKey = await generateKey(ISSUER);
    const otherKey = await generateKey(ISSUER2);

    const data = await issueFaceId(validKey);

    expect(data.proof.proofPurpose).toBe("assertionMethod");
    expect(data.proof.type).toBe("Ed25519Signature2020");
    expect(data.proof.verificationMethod).toBe(`${ISSUER}/keys/1`);

    // Verifies against the correct issuer even when a wrong one is also allowed.
    const [verified, results] = await verifyCredential(data, [otherKey, validKey]);
    expect(verified).toBe(true);

    const resultsArray = [...results.values()];
    expect(resultsArray).toHaveLength(2);
    expect(resultsArray[0].verified).toBe(false); // otherKey
    expect(resultsArray[1].verified).toBe(true); // validKey
  });

  it("issues a signed KYC v3 credential that verifies against its issuer", async () => {
    const validKey = await generateKey(ISSUER);

    const data = await issueKycV3(validKey);

    // Envelope fields are carried onto the signed credential.
    expect(data.id).toBe(CRED_ID);
    expect(data.issued).toBe(ISSUED.toISOString());
    expect(data.approvedAt).toBe(APPROVED_AT.toISOString());
    expect(data.expirationDate).toBe(EXPIRATION_DATE.toISOString());
    expect(data.level).toBe("basic+liveness");
    expect(data.kycLevel).toBe(1);

    // Structured subject is flattened + prefixed on the signed credential.
    expect(subjectOf(data).personFirstName).toBe("John");
    expect(subjectOf(data).idDocumentType).toBe("PASSPORT");

    const [verified] = await verifyCredential(data, [validKey]);
    expect(verified).toBe(true);
  });

  it("rejects a tampered FaceId credential", async () => {
    const validKey = await generateKey(ISSUER);
    const data = await issueFaceId(validKey);

    const [verified] = await verifyCredential(data, [validKey]);
    expect(verified).toBe(true);

    // Flip a subject field after signing — signature must no longer verify.
    subjectOf(data).faceSignUserId = crypto.randomUUID();
    const [verifiedAfterTamper] = await verifyCredential(data, [validKey]);
    expect(verifiedAfterTamper).toBe(false);
  });

  it("rejects a tampered KYC v3 credential", async () => {
    const validKey = await generateKey(ISSUER);
    const data = await issueKycV3(validKey);

    const [verified] = await verifyCredential(data, [validKey]);
    expect(verified).toBe(true);

    // Tamper with a subject field.
    subjectOf(data).personFirstName = "Jane";
    const [verifiedAfterSubjectTamper] = await verifyCredential(data, [validKey]);
    expect(verifiedAfterSubjectTamper).toBe(false);
  });

  it("rejects a tampered KYC v3 envelope field", async () => {
    const validKey = await generateKey(ISSUER);
    const data = await issueKycV3(validKey);

    // Tamper with a signed envelope field (e.g. extend expiry).
    data.expirationDate = new Date("2999-01-01").toISOString();
    const [verified] = await verifyCredential(data, [validKey]);
    expect(verified).toBe(false);
  });

  it("rejects verification against the wrong issuer key", async () => {
    const validKey = await generateKey(ISSUER);
    const otherKey = await generateKey(ISSUER2);

    const data = await issueFaceId(validKey);

    const [verified, results] = await verifyCredential(data, [otherKey]);
    expect(verified).toBe(false);
    expect([...results.values()][0].verified).toBe(false);
  });
});
