import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";

import type { AvailableIssuerType, VerifiableCredential } from "../types";
import type { PublicNotes } from "./types";

import { assertNoExtraFields } from "../utils";
import { issuerToKey } from "../utils/issuer";
import {
  CONTEXT_ED25519_SIGNATURE_2020_V1,
  CONTEXT_V1,
  defaultDocumentLoader,
} from "../utils/loader";
import {
  assertValid,
  fieldsOf,
  flatFieldsOf,
  fromFlat,
  sectionsOf,
  toClass,
  toFlat,
} from "./utils";

type Ctor<T> = new () => T;

/** The sections of a subject class, with their optionality dropped. */
export type Sections<TSubject> = {
  [K in keyof TSubject]-?: NonNullable<TSubject[K]>;
};

/**
 * The fields of a class that are not sections: a subject's `id`, an envelope's own fields.
 * Sections are the properties holding another class; everything a credential carries as a
 * value is one of the types below.
 */
export type OwnFields<T> = Partial<
  Pick<
    T,
    {
      [K in keyof T]-?: NonNullable<T[K]> extends string | number | boolean | Date | Buffer
        ? K
        : never;
    }[keyof T]
  >
>;

/**
 * A credential under construction: an envelope and a subject built up section by section,
 * validated as a whole, then flattened for issuance.
 *
 * Both halves stay partial until `checkValidity()` runs — proving them complete is the
 * point of that call.
 */
export abstract class VerifiableCredentialBase<TEnvelope extends object, TSubject extends object> {
  /*
   * The JSON-LD contexts, declared here and defined by each subclass. `declare static` stands in
   * for the abstract static TypeScript lacks: a subclass that forgets one is not caught at compile
   * time, but the instance methods below can read them.
   */
  declare static readonly envelopeContext: string;
  declare static readonly subjectContext: string;

  readonly envelope: Partial<TEnvelope> = {};
  readonly subject: Partial<TSubject> = {};

  protected constructor(
    private readonly envelopeClass: Ctor<TEnvelope>,
    private readonly subjectClass: Ctor<TSubject>,
  ) {}

  /**
   * Adds one section of the subject. Fields the section does not declare are rejected: they
   * would silently vanish on serialization, and a caller who misspells one deserves to hear
   * about it rather than issue a credential missing the field.
   *
   * Pass `validate: false` to defer value checks to `checkValidity()`; the extra-field check
   * always runs.
   */
  addSection<K extends keyof TSubject>(
    section: K,
    fields: Sections<TSubject>[K],
    validate = true,
  ): this {
    const meta = sectionsOf(this.subjectClass).find(({ property }) => property === section);

    if (!meta) throw new Error(`Unknown section: ${String(section)}`);

    const cls = meta.type();
    const known = new Set(fieldsOf(cls));
    const extra = Object.keys(fields).filter((field) => !known.has(field));

    if (extra.length > 0) {
      throw new Error(`Unexpected ${String(section)} fields: ${extra.join(", ")}`);
    }

    /*
     * Assigned onto a real instance rather than a bare object, so `validateSync` finds the
     * class's metadata and `instanceToPlain` applies its transforms.
     */
    const instance = Object.assign(new cls(), fields);

    if (validate) assertValid(String(section), instance);

    this.subject[section] = instance as TSubject[K];

    return this;
  }

  /**
   * Sets the subject's own fields — the ones that are not a section, such as `id`. Unknown
   * fields are rejected for the same reason `addSection` rejects them.
   *
   * Values are checked by `checkValidity()`, since a field left out here may still be filled
   * in by `setMissingFields()` later.
   */
  setSubject(fields: OwnFields<TSubject>): this {
    Object.assign(this.subject, this.ownFields("subject", this.subjectClass, fields));

    return this;
  }

  /** `setSubject`, for the envelope: `id`, `issued`, `approvedAt`, `expirationDate`. */
  setEnvelope(fields: OwnFields<TEnvelope>): this {
    Object.assign(this.envelope, this.ownFields("envelope", this.envelopeClass, fields));

    return this;
  }

  /**
   * Fills in the fields this credential derives from its own contents, then validates both
   * halves. Throws `CredentialValidationError` if either is incomplete or invalid.
   */
  checkValidity(): void {
    this.setMissingFields();

    assertValid("envelope", Object.assign(new this.envelopeClass(), this.envelope));
    assertValid("subject", Object.assign(new this.subjectClass(), this.subject));
  }

  /** The flat credential subject, with its `@context`. */
  serializeSubject(): Record<string, unknown> {
    this.checkValidity();

    return {
      "@context": [this.contexts.subjectContext],
      ...toFlat(Object.assign(new this.subjectClass(), this.subject)),
    };
  }

  /** The flat envelope fields. */
  serializeEnvelope(): Record<string, unknown> {
    this.checkValidity();

    return toFlat(Object.assign(new this.envelopeClass(), this.envelope));
  }

  /** Signs the credential with `issuer`, producing a verifiable credential. */
  async issue(issuer: AvailableIssuerType): Promise<VerifiableCredential<unknown>> {
    const key = await issuerToKey(issuer);

    const credential = {
      "@context": [CONTEXT_V1, this.contexts.envelopeContext, CONTEXT_ED25519_SIGNATURE_2020_V1],
      type: ["VerifiableCredential"],
      issuer: key.controller,
      ...this.serializeEnvelope(),
      credentialSubject: this.serializeSubject(),
    };

    return vc.issue({
      credential,
      suite: new Ed25519Signature2020({ key }),
      documentLoader: defaultDocumentLoader,
    });
  }

  /**
   * Rebuilds envelope and subject from a serialized credential.
   *
   * A subject key the class does not declare is an error: the subject context defines the
   * subject exhaustively, so an unknown key means the credential does not match the
   * `@context` it claims, and reading it anyway would silently discard what it carried.
   *
   * The envelope is the lenient half — a credential carries W3C fields of its own there
   * (`proof`, `issuanceDate`, `type`, `issuer`), which are dropped rather than rejected.
   *
   * SECURITY: this does not verify the signature. See `verifyCredential()`.
   */
  async deserialize(credential: VerifiableCredential<unknown>): Promise<void> {
    const { credentialSubject, ...envelope } = credential;

    // The subject's `@context` is the credential's own, not one of its fields.
    const { "@context": _context, ...subject } = credentialSubject as Record<string, unknown>;

    assertNoExtraFields("subject", flatFieldsOf(this.subjectClass), subject);

    Object.assign(this.envelope, fromFlat(this.envelopeClass, envelope as Record<string, unknown>));

    Object.assign(
      this.subject,
      fromFlat(this.subjectClass, credentialSubject as Record<string, unknown>),
    );
  }

  /** The credential's level, derived from its contents. */
  abstract level(): string;

  /** The credential's public notes, stored unencrypted alongside it. */
  abstract publicNotes(): PublicNotes;

  /**
   * The class's own fields, transformed onto an instance. Fields the class does not declare, or
   * declares as a section rather than a value, are rejected as they are by `add`.
   */
  private ownFields<T extends object>(label: string, cls: Ctor<T>, fields: object): Partial<T> {
    const sections = new Set(sectionsOf(cls).map(({ property }) => property));
    const own = fieldsOf(cls).filter((field) => !sections.has(field));

    assertNoExtraFields(label, new Set(own), fields);

    return toClass(cls, fields);
  }

  /** The subclass's static contexts, reached through the instance. */
  private get contexts(): typeof VerifiableCredentialBase {
    return this.constructor as typeof VerifiableCredentialBase;
  }

  /** Fills in derived envelope fields left unset by the caller. */
  protected setMissingFields(): void {
    (this.envelope as { level?: string }).level ??= this.level();
  }
}
