import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";

import type { AvailableIssuerType, VerifiableCredential } from "../types";
import type { IVerifiableCredentialContainer } from "./types";

import { base85ToFile, convertBuilderObject, issuerToKey } from "../utils";
import {
  CONTEXT_V1,
  CONTEXT_ED25519_SIGNATURE_2020_V1,
  defaultDocumentLoader,
} from "../utils/loader";

export class VerifiableCredentialContainerBase<
  TExternalEnvelopeFields,
  TStructuredSubject,
  TFlatSubject,
> implements IVerifiableCredentialContainer<
  TExternalEnvelopeFields,
  TStructuredSubject,
  TFlatSubject
> {
  public envelope: Partial<TExternalEnvelopeFields> = {};
  public subject: Partial<TStructuredSubject> = {};

  constructor(
    public readonly envelopeContext: string,
    public readonly subjectContext: string,
  ) {
    this.envelopeContext = envelopeContext;
    this.subjectContext = subjectContext;
  }

  public serialize(): TFlatSubject {
    this.checkValidity();

    return {
      "@context": [this.subjectContext],
      ...convertBuilderObject(this.subject as Record<string, Record<string, unknown>>),
    } as TFlatSubject;
  }

  public async issue(
    issuer: AvailableIssuerType,
  ): Promise<VerifiableCredential<TFlatSubject> & TExternalEnvelopeFields> {
    const key = await issuerToKey(issuer);

    const credential = {
      "@context": [CONTEXT_V1, this.envelopeContext, CONTEXT_ED25519_SIGNATURE_2020_V1],
      type: ["VerifiableCredential"],
      issuer: key.controller,
      ...convertBuilderObject({ root: this.envelope }),
      credentialSubject: this.serialize(),
    };

    const suite = new Ed25519Signature2020({ key });

    return vc.issue<TFlatSubject, TExternalEnvelopeFields>({
      credential,
      suite,
      documentLoader: defaultDocumentLoader,
    });
  }

  level(): string {
    throw new Error("Not implemented");
  }

  kycLevel(): number {
    throw new Error("Not implemented");
  }

  checkValidity(): void {
    throw new Error("Not implemented");
  }

  public async deserialize(verifiableCredential: VerifiableCredential<unknown>): Promise<void> {
    const { credentialSubject, ...envelope } = verifiableCredential;

    this.envelope = pickEnvelopeFields(
      envelope,
      this.subjectContext,
    ) as Partial<TExternalEnvelopeFields>;
    this.subject = flatSubjectToStructured(
      credentialSubject as Record<string, unknown>,
    ) as Partial<TStructuredSubject>;
  }
}

const SUBJECT_PREFIXES = [
  "sourceOfWealth",
  "residentialAddress",
  "idDocument",
  "biometric",
  "screening",
  "contact",
  "person",
  "edd",
];

const ENVELOPE_META_FIELDS = new Set([
  "@context",
  "type",
  "issuer",
  "credentialSubject",
  "issuanceDate",
  "proof",
]);

function pickEnvelopeFields(
  input: Record<string, unknown>,
  subjectContext: string,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (!ENVELOPE_META_FIELDS.has(key)) {
      output[key] = deserializeEnvelopeValue(subjectContext, key, value);
    }
  }

  return output;
}

function deserializeEnvelopeValue(subjectContext: string, key: string, value: unknown): unknown {
  if (
    (subjectContext.includes("credential-subject-v1") ||
      subjectContext.includes("credential-subject-face-id-v1")) &&
    key === "approvedAt" &&
    typeof value === "string"
  ) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }

  return value;
}

function flatSubjectToStructured(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (key === "@context" || key === "proof") {
      continue;
    }

    const prefix = SUBJECT_PREFIXES.find((candidate) => key.startsWith(candidate));

    if (!prefix) {
      output.root = {
        ...(output.root as Record<string, unknown> | undefined),
        [key]: deserializeValue(key, value),
      };
      continue;
    }

    const field = key.slice(prefix.length);
    const nestedKey = field.charAt(0).toLowerCase() + field.slice(1);
    output[prefix] = {
      ...(output[prefix] as Record<string, unknown> | undefined),
      [nestedKey]: deserializeValue(nestedKey, value),
    };
  }

  return output;
}

function deserializeValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  if (key.endsWith("File") || key.endsWith("Proof")) {
    const file = base85ToFile(value);
    return file || value;
  }

  if (key.toLowerCase().includes("date") || key.endsWith("At") || key.endsWith("Until")) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }

  return value;
}
