import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";

import type { VerifyCredentialResult } from "./verifier";

import {
  type AvailableIssuerType,
  type CredentialFields,

  // Credentials container
  CredentialFieldsSchema,
  type VerifiableCredential,

  // Current KYC default is V3
  type CredentialSubjectV3,
  type CredentialSubjectV3BuilderType,
  CredentialSubjectV3BuilderSchema,

  // Current Face ID default is V1
  type FaceIdV1,
  type FaceIdV1BuilderType,
  FaceIdV1BuilderSchema,
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

export type Credential = VerifiableCredential<CredentialSubjectV3>;
export type FaceIdCredential = VerifiableCredential<FaceIdV1>;

export type CredentialBuilder<TInput, TOutput = TInput> = (
  fields: CredentialFields,
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
    fields: CredentialFields,
    subject: TInput,
    issuer: AvailableIssuerType,
    validate = true,
  ) {
    if (validate) {
      // This raises an z.ZodError exception if the fields are invalid
      CredentialFieldsSchema.parse(fields);
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

export const credentialSubjectConverter: CredentialConverter<CredentialSubjectV3BuilderType> = (
  subject,
  validate,
) => {
  if (validate) {
    CredentialSubjectV3BuilderSchema.parse(subject);
  }

  return {
    "@context": CONTEXT_IDOS_CREDENTIAL_SUBJECT,
    ...convertBuilderObject(subject),
  };
};

export const credentialFaceIdSubjectConverter: CredentialConverter<FaceIdV1BuilderType> = (
  subject,
  validate,
) => {
  if (validate) {
    FaceIdV1BuilderSchema.parse(subject);
  }

  return {
    "@context": CONTEXT_IDOS_CREDENTIAL_FACE_ID,
    ...convertBuilderObject(subject),
  };
};

export const buildCredential: CredentialBuilder<
  CredentialSubjectV3BuilderType,
  CredentialSubjectV3
> = genericCredentialBuilder<CredentialSubjectV3BuilderType, CredentialSubjectV3>(
  credentialSubjectConverter,
);

export const buildFaceIdCredential: CredentialBuilder<FaceIdV1BuilderType, FaceIdV1> =
  genericCredentialBuilder<FaceIdV1BuilderType, FaceIdV1>(credentialFaceIdSubjectConverter);

export type { VerifyCredentialResult };
export { verifyCredential };
