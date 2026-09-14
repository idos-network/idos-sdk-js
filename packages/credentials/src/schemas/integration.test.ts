import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseCredential } from "../parser";
import { verifyCredential } from "../verifier";
import * as S from "./index";
import { flatFieldsOf } from "./utils";

const assetsDir = fileURLToPath(new URL("../../assets", import.meta.url));

const issuer = "https://my-issuer.id";
const key = await Ed25519VerificationKey2020.generate({
  id: `${issuer}/keys/1`,
  controller: `${issuer}/issuers/1`,
});
const env = { id: `${issuer}/credentials/1`, approvedAt: new Date("2022-01-01") };

// Every version issued, verified, and parsed: JSON-LD @protected rejects undefined terms,
// so this is what proves the generated contexts actually cover the classes.
describe("all versions issue + verify + parse", () => {
  it("KycV1", async () => {
    const c = new S.VerifiableCredentialKycV1()
      .setEnvelope(env)
      .setSubject({
        id: "uuid:v1",
        applicantId: "a1",
        inquiryId: "i1",
        firstName: "Ada",
        middleName: "M",
        nationality: "GB",
        familyName: "L",
        maidenName: "B",
        gender: "F",
        governmentId: "g",
        governmentIdType: "NATIONAL_ID",
        email: "a@b.com",
        ssn: "1",
        phoneNumber: "+1",
        dateOfBirth: new Date("1815-12-10"),
        placeOfBirth: "London",
        selfieFile: Buffer.from("Selfie"),
      })
      .addSection("idDocument", {
        country: "GB",
        number: "1",
        type: "PASSPORT",
        dateOfIssue: new Date("2020-01-01"),
        dateOfExpiry: new Date("2030-01-01"),
        frontFile: Buffer.from("F"),
        backFile: Buffer.from("B"),
      })
      .addSection("residentialAddress", {
        street: "S",
        houseNumber: "1",
        additionalAddressInfo: "x",
        region: "R",
        city: "London",
        postalCode: "P",
        country: "GB",
        proofCategory: "UTILITY_BILL",
        proofDateOfIssue: new Date("2021-01-01"),
        proofFile: Buffer.from("P"),
      });
    const vc = await c.issue(key);
    expect((await verifyCredential(vc, [key]))[0]).toBe(true);
    expect(await parseCredential(vc)).toBeInstanceOf(S.VerifiableCredentialKycV1);
  });

  it("KycV2", async () => {
    const c = new S.VerifiableCredentialKycV2()
      .setEnvelope({
        ...env,
        kycLevel: 2,
        issued: new Date("2022-01-01"),
        expirationDate: new Date("2030-01-01"),
      })
      .setSubject({
        id: "uuid:v2",
        firstName: "Ada",
        middleName: "M",
        nationality: "GB",
        familyName: "L",
        maidenName: "B",
        gender: "F",
        email: "a@b.com",
        phoneNumber: "+1",
        ssn: "1",
        dateOfBirth: new Date("1815-12-10"),
        placeOfBirth: "London",
        selfieFile: Buffer.from("S"),
      })
      .addSection("idDocument", {
        country: "GB",
        number: "1",
        type: "PASSPORT",
        frontFile: Buffer.from("F"),
      });
    const vc = await c.issue(key);
    expect((await verifyCredential(vc, [key]))[0]).toBe(true);
    expect(await parseCredential(vc)).toBeInstanceOf(S.VerifiableCredentialKycV2);
  });

  it("EddV1", async () => {
    const c = new S.VerifiableCredentialEddV1()
      .setEnvelope(env)
      .setSubject({ id: "uuid:edd" })
      .addSection("edd", {
        occupation: "AGRICULTURE",
        sourceOfFundsCategory: "SALARY",
        sourceOfFundsProofFile: Buffer.from("P"),
      });
    const vc = await c.issue(key);
    expect((await verifyCredential(vc, [key]))[0]).toBe(true);
    expect(await parseCredential(vc)).toBeInstanceOf(S.VerifiableCredentialEddV1);
  });

  it("FaceIdV1", async () => {
    const c = new S.VerifiableCredentialFaceIdV1()
      .setEnvelope(env)
      .setSubject({ faceSignUserId: "11111111-1111-1111-1111-111111111111" });
    const vc = await c.issue(key);
    expect((await verifyCredential(vc, [key]))[0]).toBe(true);
    expect(await parseCredential(vc)).toBeInstanceOf(S.VerifiableCredentialFaceIdV1);
  });

  it("KycV3 with every section populated", async () => {
    const c = new S.VerifiableCredentialKycV3()
      .setEnvelope(env)
      .setSubject({ id: "uuid:v3" })
      .addSection("person", {
        firstName: "J",
        familyName: "D",
        middleName: "M",
        fatherName: "F",
        maidenName: "N",
        motherName: "MO",
        gender: "M",
        nationality: "US",
        secondNationality: "GB",
        dateOfBirth: new Date("1990-01-01"),
        placeOfBirth: "NY",
        regionOfBirth: "NY",
        stateless: false,
        refugeeStatus: false,
        subsidiaryProtectionStatus: false,
        nationalIdNumber: "1",
        taxIdNumber: "2",
        taxIdIssuingCountry: "US",
        taxResidenceCountry: "US",
        ssn: "3",
      })
      .addSection("idDocument", {
        type: "PASSPORT",
        number: "1",
        country: "US",
        dateOfExpiry: new Date("2030-01-01"),
        dateOfIssue: new Date("2020-01-01"),
        issuingAuthority: "DOS",
        frontFile: Buffer.from("F"),
        backFile: Buffer.from("B"),
        mrzLine1: "P<USA",
        title: "Dr",
        extendedValidUntil: new Date("2031-01-01"),
        additionalNumber: "9",
        ethnicity: "x",
        issuingSubdivision: "CA",
      })
      .addSection("contact", { email: "j@e.com", phoneNumber: "+1" })
      .addSection("biometric", { selfieFile: Buffer.from("S"), selfieMatch: 99 })
      .addSection("residentialAddress", {
        verified: true,
        street: "S",
        houseNumber: "1",
        additionalAddressInfo: "x",
        region: "R",
        city: "NY",
        postalCode: "P",
        country: "US",
        proofCategory: "UTILITY_BILL",
        proofDateOfIssue: new Date("2021-01-01"),
        proofFile: Buffer.from("P"),
        ipCountry: "US",
      })
      .addSection("screening", {
        sanctionsCheckResult: "CLEAR",
        sanctionsConfidenceScore: 95,
        pepCheckResult: "CLEAR",
        pepConfidenceScore: 10,
      })
      .addSection("edd", {
        occupation: "REAL_ESTATE",
        sourceOfFundsCategory: "SALARY",
        sourceOfFundsProofFile: Buffer.from("F"),
      })
      .addSection("sourceOfWealth", {
        type: "SALARY",
        yearlyGrossIncome: "LESS_THAN_20000",
        yearlyGrossIncomeCurrency: "EUR",
        approximateNetWorth: "UP_TO_25000",
        approximateNetWorthCurrency: "EUR",
        sourceOfWealthProofFile: Buffer.from("P"),
      })
      .addSection("onboarding", {
        intendedUse: "INVESTING",
        employmentStatus: "EMPLOYED",
        expectedMonthlyTransactionCount: "LESS_THAN_5",
        expectedMonthlyTransactionVolume: "MORE_THAN_500_LESS_THAN_2000",
        expectedMonthlyTransactionVolumeCurrency: "EUR",
      });
    const vc = await c.issue(key);
    expect((await verifyCredential(vc, [key]))[0]).toBe(true);
    const parsed = await parseCredential(vc);
    expect(parsed).toBeInstanceOf(S.VerifiableCredentialKycV3);
    expect(c.kycLevel()).toBe(3);
  });
});

// Every generated context key must be a key the class accepts, and vice versa.
describe("generated contexts match the classes", () => {
  const cases = [
    ["idos-credential-subject-v1", S.VerifiableCredentialKycV1],
    ["idos-credential-subject-v2", S.VerifiableCredentialKycV2],
    ["idos-credential-subject-v3", S.VerifiableCredentialKycV3],
    ["idos-credential-subject-face-id-v1", S.VerifiableCredentialFaceIdV1],
    ["idos-credential-subject-edd-v1", S.VerifiableCredentialEddV1],
  ] as const;

  it.each(cases)("%s", async (asset, Version) => {
    const ctx = JSON.parse(readFileSync(`${assetsDir}/${asset}.json`, "utf8"))["@context"];
    const ctxKeys = Object.keys(ctx).filter(
      (k) => !k.startsWith("@") && k !== "xsd" && k !== "aux",
    );
    // biome-ignore lint: reading a private field for review purposes
    const accepted = flatFieldsOf((new Version() as any).subjectClass);
    const notAccepted = ctxKeys.filter((k) => !accepted.has(k));
    const notInContext = [...accepted].filter(
      (k) => !ctxKeys.includes(k) && !["id", "issued", "expirationDate"].includes(k),
    );
    expect({ notAccepted, notInContext }).toEqual({ notAccepted: [], notInContext: [] });
  });
});
