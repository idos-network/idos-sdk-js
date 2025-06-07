import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import * as vc from "@digitalbazaar/vc";
import { type AvailableIssuerType, convertValues, issuerToKey } from "./utils";
import {
  CONTEXT_ED25519_SIGNATURE_2020_V1,
  CONTEXT_IDOS_CREDENTIALS_V1,
  CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT,
  CONTEXT_V1,
  defaultDocumentLoader,
} from "./utils/loader";
import type {
  CredentialFields,
  CredentialSubject,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "./utils/types";

export type Credentials = VerifiableCredential<VerifiableCredentialSubject>;

export async function buildCredentials(
  fields: CredentialFields,
  subject: CredentialSubject,
  issuer: AvailableIssuerType,
): Promise<Credentials> {
  const { residentialAddress, ...subjectData } = subject;

  const credentialSubject = {
    "@context": CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT,
    ...convertValues(subjectData),
    ...(residentialAddress ? convertValues(residentialAddress, "residentialAddress") : {}),
  };

  const key = await issuerToKey(issuer);

  // Create credentials container
  const credential = {
    "@context": [CONTEXT_V1, CONTEXT_IDOS_CREDENTIALS_V1, CONTEXT_ED25519_SIGNATURE_2020_V1],
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
