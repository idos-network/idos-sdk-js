import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";

import type { VerifyCredentialResult } from "./verifier";

import {
  type AvailableIssuerType,
  type VerifiableCredential,

  // Credentials container default is V2
  EnvelopeExtensionLatestBuilderSchema,
  type EnvelopeExtensionLatestBuilderType,

  // Current KYC default is V3
  type KycSubjectLatest,
  type KycSubjectLatestBuilderType,
  KycSubjectLatestBuilderSchema,

  // Current Face ID default is V1
  type FaceIdSubjectLatest,
  type FaceIdSubjectLatestBuilderType,
  FaceIdSubjectLatestBuilderSchema,
} from "../types";
import { convertBuilderObject, issuerToKey } from "../utils";
import {
  CONTEXT_IDOS_CREDENTIAL,
  CONTEXT_IDOS_CREDENTIAL_FACE_ID,
  CONTEXT_IDOS_CREDENTIAL_SUBJECT,
  CONTEXT_IDOS_SIGNATURE,
  CONTEXT_V1,
  defaultDocumentLoader,
} from "./loader";
import { verifyCredential } from "./verifier";

/**
 * Warning: This builder is for the latest versions of the credential types (only).
 * Even we exports other types, it's for backward compatibility and should not be used.
 * Backward compatibility for now should be implemented in your package.
 * This is essentially the wrong way forward, consumer should be able to fetch
 * the right credential object from idOS.
 */
export type VCKyc = Awaited<ReturnType<typeof buildKycCredential>>;
export type VCFaceId = Awaited<ReturnType<typeof buildFaceIdCredential>>;

export type CredentialBuilder<TInput, TOutput = TInput> = (
  fields: EnvelopeExtensionLatestBuilderType["root"],
  subject: TInput,
  issuer: AvailableIssuerType,
  validate?: boolean,
) => Promise<VerifiableCredential<TOutput>>;

export type CredentialConverter<TInput> = (
  subject: TInput,
  validate: boolean,
  // oxlint-disable-next-line typescript/no-explicit-any -- any is needed here
) => Record<string, any>;

function genericCredentialBuilder<TInput, TOutput = TInput>(
  credentialConverter: CredentialConverter<TInput>,
): CredentialBuilder<TInput, TOutput> {
  async function builder(
    fields: EnvelopeExtensionLatestBuilderType["root"],
    subject: TInput,
    issuer: AvailableIssuerType,
    validate = true,
  ) {
    if (validate) {
      // This raises an z.ZodError exception if the fields are invalid
      EnvelopeExtensionLatestBuilderSchema.parse({ root: fields });
    }

    const credentialSubject = credentialConverter(subject, validate);

    const key = await issuerToKey(issuer);

    // Create credentials container
    const credential = {
      "@context": [CONTEXT_V1, CONTEXT_IDOS_CREDENTIAL, CONTEXT_IDOS_SIGNATURE],
      type: ["VerifiableCredential"],
      issuer: key.controller,
      ...convertBuilderObject({ root: fields }),
      credentialSubject,
    };

    const suite = new Ed25519Signature2020({ key });

    return vc.issue<TOutput>({
      credential,
      suite,
      documentLoader: defaultDocumentLoader,
    });
  }

  return builder;
}

export const credentialSubjectConverter: CredentialConverter<KycSubjectLatestBuilderType> = (
  subject,
  validate,
) => {
  if (validate) {
    KycSubjectLatestBuilderSchema.parse(subject);
  }

  return {
    "@context": CONTEXT_IDOS_CREDENTIAL_SUBJECT,
    ...convertBuilderObject(subject),
  };
};

export const credentialFaceIdSubjectConverter: CredentialConverter<
  FaceIdSubjectLatestBuilderType
> = (subject, validate) => {
  if (validate) {
    FaceIdSubjectLatestBuilderSchema.parse(subject);
  }

  return {
    "@context": CONTEXT_IDOS_CREDENTIAL_FACE_ID,
    ...convertBuilderObject(subject),
  };
};

export const buildLatestKycVC: CredentialBuilder<KycSubjectLatestBuilderType, KycSubjectLatest> =
  genericCredentialBuilder<KycSubjectLatestBuilderType, KycSubjectLatest>(
    credentialSubjectConverter,
  );

export const buildLatestFaceIdVC: CredentialBuilder<
  FaceIdSubjectLatestBuilderType,
  FaceIdSubjectLatest
> = genericCredentialBuilder<FaceIdSubjectLatestBuilderType, FaceIdSubjectLatest>(
  credentialFaceIdSubjectConverter,
);

export type { VerifyCredentialResult };
export { verifyCredential };
