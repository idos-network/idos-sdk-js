import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";

import type { AvailableIssuerType, VerifiableCredential } from "../types";
import type { IVerifiableCredentialContainer } from "./types";

import {
  CONTEXT_V1,
  BASE_PUBLIC_URL,
  CONTEXT_ED25519_SIGNATURE_2020_V1,
  defaultDocumentLoader,
} from "../builder/loader";
import { convertBuilderObject, issuerToKey } from "../utils";

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

  public async issue(
    issuer: AvailableIssuerType,
  ): Promise<VerifiableCredential<TFlatSubject> & TExternalEnvelopeFields> {
    this.checkValidity();

    const key = await issuerToKey(issuer);

    const credential = {
      "@context": [
        CONTEXT_V1,
        `${BASE_PUBLIC_URL}${this.envelopeContext}`,
        CONTEXT_ED25519_SIGNATURE_2020_V1,
      ],
      type: ["VerifiableCredential"],
      issuer: key.controller,
      ...convertBuilderObject({ root: this.envelope }),
      credentialSubject: convertBuilderObject(
        this.subject as Record<string, Record<string, unknown>>,
      ),
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

  get subjectData(): TFlatSubject {
    throw new Error("Not implemented");
  }

  get envelopeData(): TExternalEnvelopeFields {
    throw new Error("Not implemented");
  }

  public async deserialize(
    verifiableCredential: VerifiableCredential<TFlatSubject> & TExternalEnvelopeFields,
  ): Promise<void> {
    throw new Error("Not implemented");
  }
}
