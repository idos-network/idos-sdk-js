import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";
import { z } from "zod";

import type { AvailableIssuerType, VerifiableCredential } from "../types";
import type { IVerifiableCredentialContainer, PublicNotes } from "./types";

import { assertNoExtraFields } from "../utils";
import { flatObjectToStructured, flatSubjectToStructured } from "../utils/deserialization";
import { issuerToKey } from "../utils/issuer";
import {
  CONTEXT_V1,
  CONTEXT_ED25519_SIGNATURE_2020_V1,
  defaultDocumentLoader,
} from "../utils/loader";
import { convertBuilderObject } from "../utils/serialization";
import { deriveSectionMaps } from "./utils";

export class VerifiableCredentialContainerBase<
  TExternalEnvelopeFields extends { level: string },
  TStructuredSubject extends Record<string, unknown> & { root: unknown },
  TFlatSubject,
> implements IVerifiableCredentialContainer<
  TExternalEnvelopeFields,
  TStructuredSubject,
  TFlatSubject
> {
  public envelope: Partial<TExternalEnvelopeFields> = {};
  public subject: Partial<TStructuredSubject> = {};

  private readonly sectionSchemas: Record<keyof TStructuredSubject, z.ZodObject<z.ZodRawShape>>;
  private readonly sectionFields: Record<keyof TStructuredSubject, Set<string>>;

  constructor(
    public readonly envelopeContext: string,
    public readonly subjectContext: string,
    public readonly envelopeSchema: z.ZodObject<z.ZodRawShape>,
    public readonly subjectSchema: z.ZodSchema<TStructuredSubject>,
  ) {
    const { schemas, fields } = deriveSectionMaps(subjectSchema as z.ZodObject<z.ZodRawShape>);
    this.sectionSchemas = schemas as Record<keyof TStructuredSubject, z.ZodObject<z.ZodRawShape>>;
    this.sectionFields = fields as Record<keyof TStructuredSubject, Set<string>>;
  }

  public setMandatoryEnvelopeFields(fields: Omit<TExternalEnvelopeFields, "level">): void {
    this.envelopeSchema.omit({ level: true }).parse(fields);
    this.envelope = fields as Partial<TExternalEnvelopeFields>;
  }

  public setMandatoryFields(root: TStructuredSubject["root"]): void {
    this.add("root", root);
  }

  public serializeSubject(): TFlatSubject {
    this.checkValidity();

    return {
      "@context": [this.subjectContext],
      ...convertBuilderObject(this.subject as Record<string, Record<string, unknown>>),
    } as TFlatSubject;
  }

  public serializeEnvelope(): TExternalEnvelopeFields {
    this.checkValidity();

    return {
      ...this.envelope,
    } as TExternalEnvelopeFields;
  }

  public async issue(
    issuer: AvailableIssuerType,
  ): Promise<VerifiableCredential<TFlatSubject> & TExternalEnvelopeFields> {
    const key = await issuerToKey(issuer);

    const credential = {
      "@context": [CONTEXT_V1, this.envelopeContext, CONTEXT_ED25519_SIGNATURE_2020_V1],
      type: ["VerifiableCredential"],
      issuer: key.controller,
      ...this.serializeEnvelope(),
      credentialSubject: this.serializeSubject(),
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

  publicNotes(): PublicNotes {
    throw new Error("Not implemented");
  }

  checkValidity(): void {
    this.setMissingFields();
    this.envelopeSchema.parse(this.envelope);
    this.subjectSchema.parse(this.subject);
  }

  protected setMissingFields(): void {
    if (!this.envelope.level) {
      this.envelope.level = this.level();
    }
  }

  add<SectionName extends keyof TStructuredSubject>(
    section: SectionName,
    fields: TStructuredSubject[SectionName],
    validate: boolean = true,
  ): void {
    assertNoExtraFields(String(section), this.sectionFields[section], fields as object);

    if (validate) {
      this.sectionSchemas[section].parse(fields);
    }

    this.subject[section] = fields;
  }

  public async deserialize(verifiableCredential: VerifiableCredential<unknown>): Promise<void> {
    const { credentialSubject, ...envelope } = verifiableCredential;

    this.envelope = flatObjectToStructured(
      envelope as Record<string, unknown>,
      this.envelopeSchema,
    ) as Partial<TExternalEnvelopeFields>;

    this.subject = flatSubjectToStructured(
      credentialSubject as Record<string, unknown>,
      this.subjectSchema,
    ) as Partial<TStructuredSubject>;
  }
}
