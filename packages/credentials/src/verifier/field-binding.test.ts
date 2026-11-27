import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { hasOnlyContextUrls, verifyCredential } from ".";
import idosCredentialSubjectEddV2 from "../../assets/idos-credential-subject-edd-v2.json";
import idosCredentialSubjectV3 from "../../assets/idos-credential-subject-v3.json";
import idosCredentialSubjectV4 from "../../assets/idos-credential-subject-v4.json";
import { parseCredential } from "../parser";
import {
  VerifiableCredentialEddV1,
  VerifiableCredentialEddV2,
  VerifiableCredentialKycV3,
  VerifiableCredentialKycV4,
} from "../schemas";

/*
 * KYC v4 and EDD v2 give every field an explicit IRI in the idOS vocabulary, so the proof binds
 * each value to its field. That published contexts keep their definitions is checked in
 * `published-contexts.test.ts`.
 */

const ISSUER = "https://vc-issuers.cool.id/idos";
const CRED_ID = `${ISSUER}/credentials/z6MkszZtxCmA2Ce4vUV132PCuLQmwnaDD5mw2L23fGNnsiX3`;
const IDOS_VOCAB = "https://vocab.idos.network/credentials#";

type Context = { "@context": Record<string, unknown> };

/** The terms a context defines for credential fields, without JSON-LD keywords and prefixes. */
function fieldTerms(context: Context): [string, unknown][] {
  return Object.entries(context["@context"]).filter(
    ([term]) => !term.startsWith("@") && term !== "xsd" && term !== "aux",
  );
}

function subjectOf(credential: { credentialSubject: unknown }): Record<string, unknown> {
  return credential.credentialSubject as Record<string, unknown>;
}

function generateKey() {
  return Ed25519VerificationKey2020.generate({
    id: `${ISSUER}/keys/1`,
    controller: `${ISSUER}/issuers/1`,
  });
}

async function issueKyc(
  Version: typeof VerifiableCredentialKycV3 | typeof VerifiableCredentialKycV4,
  key: Ed25519VerificationKey2020,
) {
  const credential = new Version();
  credential.setEnvelope({
    id: CRED_ID,
    issued: new Date("2022-01-01"),
    approvedAt: new Date("2022-01-02"),
    expirationDate: new Date("2030-01-01"),
  });
  credential.setSubject({ id: "uuid:abc" });
  credential.addSection("person", {
    firstName: "John",
    familyName: "Lennon",
    nationality: "DE",
    dateOfBirth: new Date("1980-01-01"),
  });
  credential.addSection("idDocument", {
    type: "PASSPORT",
    number: "123456789",
    country: "DE",
    frontFile: Buffer.from("Front"),
    frontFileType: "image/jpeg",
    frontFileName: "front.jpg",
  });
  credential.addSection("screening", {
    source: "DB",
    sanctionsCheckResult: "NOT_CHECKED",
    pepCheckResult: "CLEAR",
  });
  return credential.issue(key);
}

async function issueEdd(
  Version: typeof VerifiableCredentialEddV1 | typeof VerifiableCredentialEddV2,
  key: Ed25519VerificationKey2020,
) {
  return new Version()
    .setEnvelope({ id: CRED_ID })
    .setSubject({ id: "uuid:abc" })
    .addSection("edd", { occupation: "AGRICULTURE", sourceOfFundsCategory: "SALARY" })
    .issue(key);
}

/** Exchanges the values of two subject fields in place. */
function rearrange(credential: { credentialSubject: unknown }, a: string, b: string) {
  const subject = subjectOf(credential);
  [subject[a], subject[b]] = [subject[b], subject[a]];
}

describe("per-field IRI contexts", () => {
  it.each([
    ["KYC v4", idosCredentialSubjectV4],
    ["EDD v2", idosCredentialSubjectEddV2],
  ])("%s gives every field its own IRI in the idOS vocabulary", (_name, context) => {
    const terms = fieldTerms(context);
    expect(terms.length).toBeGreaterThan(0);

    for (const [term, definition] of terms) {
      expect(definition).toEqual({ "@id": `${IDOS_VOCAB}${term}`, "@type": expect.any(String) });
    }
  });

  it("KYC v4 keeps the v3 fields, with timestamps for dates", () => {
    const v3 = fieldTerms(idosCredentialSubjectV3);
    const v4 = new Map(fieldTerms(idosCredentialSubjectV4));

    expect([...v4.keys()].sort()).toEqual(v3.map(([term]) => term).sort());

    for (const [term, type] of v3) {
      const expected = type === "xsd:date" ? "xsd:dateTime" : type;
      expect((v4.get(term) as { "@type": string })["@type"]).toBe(expected);
    }
  });

  it("the vocabulary document lists every per-field IRI with its type", () => {
    const xml = readFileSync(new URL("../../assets/idos-vocab.xml", import.meta.url), "utf8");
    const listed = new Map(
      [
        ...xml.matchAll(
          /<rdf:Property rdf:about="([^"]+)">[\s\S]*?<rdfs:range rdf:resource="([^"]+)"\/>/g,
        ),
      ].map(([, id, range]) => [id, range]),
    );

    const expected = new Map<string, string>();
    for (const context of [idosCredentialSubjectV4, idosCredentialSubjectEddV2]) {
      for (const [, definition] of fieldTerms(context)) {
        const { "@id": id, "@type": type } = definition as { "@id": string; "@type": string };
        expected.set(id, type.replace(/^xsd:/, "http://www.w3.org/2001/XMLSchema#"));
      }
    }

    expect(listed).toEqual(expected);
  });
});

describe("field binding", () => {
  it.each([
    ["names", "personFirstName", "personFamilyName"],
    ["screening results", "screeningSanctionsCheckResult", "screeningPepCheckResult"],
    ["nationality and document type", "personNationality", "idDocumentType"],
  ])("rejects a KYC v4 credential whose %s were rearranged after signing", async (_name, a, b) => {
    const key = await generateKey();
    const credential = await issueKyc(VerifiableCredentialKycV4, key);

    const [verified] = await verifyCredential(credential, [key]);
    expect(verified).toBe(true);

    rearrange(credential, a, b);

    const [verifiedAfterTamper] = await verifyCredential(credential, [key]);
    expect(verifiedAfterTamper).toBe(false);
  });

  it("rejects an EDD v2 credential whose fields were rearranged after signing", async () => {
    const key = await generateKey();
    const credential = await issueEdd(VerifiableCredentialEddV2, key);

    const [verified] = await verifyCredential(credential, [key]);
    expect(verified).toBe(true);

    rearrange(credential, "eddOccupation", "eddSourceOfFundsCategory");

    const [verifiedAfterTamper] = await verifyCredential(credential, [key]);
    expect(verifiedAfterTamper).toBe(false);
  });
});

describe("context URLs", () => {
  it("rejects a KYC v4 credential whose subject context was replaced by an embedded copy", async () => {
    const key = await generateKey();
    const credential = await issueKyc(VerifiableCredentialKycV4, key);
    const a = "screeningSanctionsCheckResult";
    const b = "screeningPepCheckResult";

    // The same context with the IRIs of two fields exchanged expands to the signed graph.
    const embedded = structuredClone(idosCredentialSubjectV4["@context"]) as unknown as Record<
      string,
      { "@id": string }
    >;
    [embedded[a], embedded[b]] = [
      { ...embedded[a], "@id": embedded[b]["@id"] },
      { ...embedded[b], "@id": embedded[a]["@id"] },
    ];
    rearrange(credential, a, b);
    subjectOf(credential)["@context"] = [embedded];

    const [verified] = await verifyCredential(credential, [key]);
    expect(verified).toBe(false);
  });

  it.each([
    ["a URL", { "@context": "https://example.com/context.json" }],
    ["a list of URLs", { "@context": ["https://a.example/c.json", "https://b.example/c.json"] }],
    ["no context", { id: "uuid:abc" }],
  ])("accepts %s", (_name, document) => {
    expect(hasOnlyContextUrls(document)).toBe(true);
  });

  it.each([
    ["an embedded context", { "@context": { name: "https://schema.org/name" } }],
    ["an embedded context in a list", { "@context": ["https://a.example/c.json", {}] }],
    ["a nested embedded context", { credentialSubject: { "@context": [{ "@import": "x" }] } }],
    ["one inside an array value", { items: [{ "@context": {} }] }],
  ])("rejects %s", (_name, document) => {
    expect(hasOnlyContextUrls(document)).toBe(false);
  });
});

describe("parsing", () => {
  it("parses a KYC v4 credential as KycV4, which is also a KycV3", async () => {
    const key = await generateKey();
    const credential = await issueKyc(VerifiableCredentialKycV4, key);

    const parsed = await parseCredential(credential);

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV4);
    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV3);
  });

  it("still parses a KYC v3 credential as KycV3 only", async () => {
    const key = await generateKey();
    const credential = await issueKyc(VerifiableCredentialKycV3, key);

    const parsed = await parseCredential(credential);

    expect(parsed).toBeInstanceOf(VerifiableCredentialKycV3);
    expect(parsed).not.toBeInstanceOf(VerifiableCredentialKycV4);
  });

  it("parses an EDD v2 credential as EddV2", async () => {
    const key = await generateKey();
    const credential = await issueEdd(VerifiableCredentialEddV2, key);

    expect(await parseCredential(credential)).toBeInstanceOf(VerifiableCredentialEddV2);
  });
});
