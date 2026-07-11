import type { AvailableIssuerType, VerifiableCredential } from "../types";

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

  // Derive kycLevel
  kycLevel(): number;

  // Serialized verifiable credential
  issue(
    issuer: AvailableIssuerType,
  ): Promise<VerifiableCredential<TFlatSubject> & TExternalEnvelopeFields>;

  // Serialize verifiable credential
  serialize(): TFlatSubject;

  // Deserialize verifiable credential
  deserialize(verifiableCredential: VerifiableCredential<unknown>): Promise<void>;
}
