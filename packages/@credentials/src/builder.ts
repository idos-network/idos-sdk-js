import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";
import { type AvailableIssuerType, convertValues, issuerToKey } from "./utils";
import {
  CONTEXT_IDOS_CREDENTIALS,
  CONTEXT_IDOS_CREDENTIALS_FACE_ID,
  CONTEXT_IDOS_CREDENTIALS_SUBJECT,
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

export type Credentials = VerifiableCredential<VerifiableCredentialSubject>;
export type FaceIdCredentials = VerifiableCredential<CredentialSubjectFaceId>;

export type CredentialsBuilder<TInput, TOutput = TInput> = (
  fields: CredentialFields,
  subject: TInput,
  issuer: AvailableIssuerType,
  validate?: boolean,
) => Promise<VerifiableCredential<TOutput>>;

function genericCredentialsBuilder<TInput, TOutput = TInput>(
  schemaKlass: { parse: (data: TInput) => void },
  // biome-ignore lint/suspicious/noExplicitAny: Any is expected
  credentialsSubjectBuilder: (subject: TInput) => Record<string, any>,
): CredentialsBuilder<TInput, TOutput> {
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
      "@context": [CONTEXT_V1, CONTEXT_IDOS_CREDENTIALS, CONTEXT_IDOS_SIGNATURE],
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

export const buildCredentials: CredentialsBuilder<CredentialSubject, VerifiableCredentialSubject> =
  genericCredentialsBuilder<CredentialSubject, VerifiableCredentialSubject>(
    CredentialSubjectSchema,
    (subject: CredentialSubject) => {
      const { residentialAddress, ...subjectData } = subject;

      return {
        "@context": CONTEXT_IDOS_CREDENTIALS_SUBJECT,
        ...convertValues(subjectData),
        // @ts-expect-error - TODO: fix this
        ...(residentialAddress ? convertValues(residentialAddress, "residentialAddress") : {}),
      };
    },
  );

export const buildFaceIdCredentials: CredentialsBuilder<CredentialSubjectFaceId> =
  genericCredentialsBuilder<CredentialSubjectFaceId>(
    CredentialSubjectFaceIdSchema,
    (subject: CredentialSubjectFaceId) => {
      return {
        "@context": CONTEXT_IDOS_CREDENTIALS_FACE_ID,
        ...convertValues(subject),
      };
    },
  );
