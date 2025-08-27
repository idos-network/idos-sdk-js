import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";
import { type AvailableIssuerType, convertValues, issuerToKey } from "./utils";
import {
  CONTEXT_IDOS_CREDENTIALS,
  CONTEXT_IDOS_CREDENTIALS_SUBJECT,
  CONTEXT_IDOS_SIGNATURE,
  CONTEXT_V1,
  defaultDocumentLoader,
} from "./utils/loader";
import {
  type CredentialFields,
  CredentialFieldsSchema,
  type CredentialSubject,
  CredentialSubjectSchema,
  type VerifiableCredential,
  type VerifiableCredentialSubject,
} from "./utils/types";

export type Credentials = VerifiableCredential<VerifiableCredentialSubject>;

export async function buildCredentials(
  fields: CredentialFields,
  subject: CredentialSubject,
  issuer: AvailableIssuerType,
  validate = true,
): Promise<Credentials> {
  if (validate) {
    // This raises an z.ZodError exception if the fields are invalid
    CredentialFieldsSchema.parse(fields);
    CredentialSubjectSchema.parse(subject);
  }

  const { residentialAddress, ...subjectData } = subject;

  const credentialSubject = {
    "@context": CONTEXT_IDOS_CREDENTIALS_SUBJECT,
    ...convertValues(subjectData),
    // @ts-expect-error - TODO: fix this
    ...(residentialAddress ? convertValues(residentialAddress, "residentialAddress") : {}),
  };

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

  return vc.issue<VerifiableCredentialSubject>({
    credential,
    suite,
    documentLoader: defaultDocumentLoader,
  });
}
