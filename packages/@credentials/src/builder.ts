import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";
import { type AvailableIssuerType, convertValues, issuerToKey } from "./utils";
import {
  CONTEXT_IDOS_CREDENTIAL,
  CONTEXT_IDOS_CREDENTIAL_FACE_ID,
  CONTEXT_IDOS_CREDENTIAL_SUBJECT,
  CONTEXT_IDOS_SIGNATURE,
  CONTEXT_V1,
  defaultDocumentLoader,
} from "./utils/loader";
import {
  type CredentialFields,
  CredentialFieldsSchema,
  type CredentialSubject,
  type CredentialSubjectFaceId,
  CredentialSubjectFaceIdSchema,
  CredentialSubjectSchema,
  type VerifiableCredential,
  type VerifiableCredentialSubject,
} from "./utils/types";

export type Credential = VerifiableCredential<VerifiableCredentialSubject>;
export type FaceIdCredential = VerifiableCredential<CredentialSubjectFaceId>;

export type CredentialBuilder<TInput, TOutput = TInput> = (
  fields: CredentialFields,
  subject: TInput,
  issuer: AvailableIssuerType,
  validate?: boolean,
) => Promise<VerifiableCredential<TOutput>>;

function genericCredentialBuilder<TInput, TOutput = TInput>(
  schemaKlass: { parse: (data: TInput) => void },
  // biome-ignore lint/suspicious/noExplicitAny: Any is expected
  credentialsSubjectBuilder: (subject: TInput) => Record<string, any>,
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
      schemaKlass.parse(subject);
    }

    const credentialSubject = credentialsSubjectBuilder(subject);

    const key = await issuerToKey(issuer);

    // Create credentials container
    const credential = {
      "@context": [CONTEXT_V1, CONTEXT_IDOS_CREDENTIAL, CONTEXT_IDOS_SIGNATURE],
      type: ["VerifiableCredential"],
      issuer: key.controller,
      ...convertValues(fields),
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

export const buildCredential: CredentialBuilder<CredentialSubject, VerifiableCredentialSubject> =
  genericCredentialBuilder<CredentialSubject, VerifiableCredentialSubject>(
    CredentialSubjectSchema,
    (subject: CredentialSubject) => {
      const { residentialAddress, ...subjectData } = subject;

      return {
        "@context": CONTEXT_IDOS_CREDENTIAL_SUBJECT,
        ...convertValues(subjectData),
        // @ts-expect-error - TODO: fix this
        ...(residentialAddress ? convertValues(residentialAddress, "residentialAddress") : {}),
      };
    },
  );

export const buildFaceIdCredential: CredentialBuilder<CredentialSubjectFaceId> =
  genericCredentialBuilder<CredentialSubjectFaceId>(
    CredentialSubjectFaceIdSchema,
    (subject: CredentialSubjectFaceId) => {
      return {
        "@context": CONTEXT_IDOS_CREDENTIAL_FACE_ID,
        ...convertValues(subject),
      };
    },
  );
