import type {
  EnvelopeExtensionV1,
  EnvelopeExtensionV2,
  FaceIdSubjectV1,
  KycSubjectV1,
  KycSubjectV2,
  KycSubjectV3,
} from "../types";

import {
  ENVELOPE_REGISTRY,
  SUBJECT_REGISTRY,
  type EnvelopeRegistryEntry,
  type SubjectRegistryEntry,
} from "../schemas/registry";

// ponytail: zod strips unknown keys, so parsing the raw VC objects (which still
// carry @context / proof) against the flat schemas yields clean, typed results.

type Unknown = Record<string, unknown>;

export type ParsedSubject =
  | { type: "kyc"; version: "v1"; subject: KycSubjectV1 }
  | { type: "kyc"; version: "v2"; subject: KycSubjectV2 }
  | { type: "kyc"; version: "v3"; subject: KycSubjectV3 }
  | { type: "faceId"; version: "v1"; subject: FaceIdSubjectV1 }
  | { type: "unknown"; version: "unknown"; subject: Unknown };

export type ParsedEnvelope =
  | { version: "v1"; envelope: EnvelopeExtensionV1 }
  | { version: "v2"; envelope: EnvelopeExtensionV2 }
  | { version: "unknown"; envelope: Unknown };

export type ParsedCredential = {
  envelope: ParsedEnvelope;
  subject: ParsedSubject;
};

function contexts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function match<E extends { context: string }>(
  entries: readonly E[],
  value: unknown,
): E | undefined {
  const ctx = contexts(value);
  return entries.find((entry) => ctx.includes(entry.context));
}

/** Parse a `credentialSubject` into its versioned Zod type based on its `@context`. */
export function parseCredentialSubject(input: object): ParsedSubject {
  const subject = input as Unknown;
  const entry: SubjectRegistryEntry | undefined = match(SUBJECT_REGISTRY, subject["@context"]);
  if (!entry) return { type: "unknown", version: "unknown", subject };

  // Cast: the registry pairs each context with the matching flat type; the
  // discriminated union above documents the (type, version) → shape relation.
  return {
    type: entry.type,
    version: entry.version,
    subject: entry.schema.parse(subject),
  } as ParsedSubject;
}

/** Parse the credential envelope (top-level level/kycLevel/...) by its `@context`. */
export function parseEnvelope(input: object): ParsedEnvelope {
  const credential = input as Unknown;
  const entry: EnvelopeRegistryEntry | undefined = match(ENVELOPE_REGISTRY, credential["@context"]);
  if (!entry) return { version: "unknown", envelope: credential };

  return {
    version: entry.version,
    envelope: entry.schema.parse(credential),
  } as ParsedEnvelope;
}

/** Parse a full verifiable credential into its versioned envelope + subject. */
export function parseCredential(input: object): ParsedCredential {
  const credential = input as Unknown;
  const subject = (credential.credentialSubject ?? {}) as Unknown;
  return {
    envelope: parseEnvelope(credential),
    subject: parseCredentialSubject(subject),
  };
}
