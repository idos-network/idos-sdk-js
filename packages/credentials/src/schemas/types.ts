import type { AvailableIssuerType, VerifiableCredential } from "../types";

export type PublicNotesAllowedValues = number | string | Date | undefined;
export type PublicNotes = Record<
  string,
  PublicNotesAllowedValues | Record<string, PublicNotesAllowedValues> | undefined
>;

export interface IVerifiableCredentialContainer<
  TExternalEnvelopeFields,
  TStructuredSubject,
  TFlatSubject,
> {
  // Envelope @context
  readonly envelopeContext: string;

  // Subject @context
  readonly subjectContext: string;

  // envelope POJO to construct the verifiable credential envelope
  envelope: Partial<TExternalEnvelopeFields>;

  // Subject POJO to construct the verifiable credential subject
  subject: Partial<TStructuredSubject>;

  // Return if the container is valid (has all required fields)
  checkValidity(): void;

  // Derive level
  level(): string;

  // Derive public_notes
  publicNotes(): PublicNotes;

  // Serialized verifiable credential
  issue(
    issuer: AvailableIssuerType,
  ): Promise<VerifiableCredential<TFlatSubject> & TExternalEnvelopeFields>;

  // Serialize verifiable credential
  serializeSubject(): TFlatSubject;

  // Serialize verifiable credential envelope
  serializeEnvelope(): TExternalEnvelopeFields;

  // Deserialize verifiable credential
  deserialize(verifiableCredential: VerifiableCredential<unknown>): Promise<void>;
}
