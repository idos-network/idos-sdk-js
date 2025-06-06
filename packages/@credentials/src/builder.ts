import { Ed25519Signature2020 } from "@digitalbazaar/ed25519-signature-2020";
import {
  Ed25519VerificationKey2020,
  type Ed25519VerificationKey2020Options,
} from "@digitalbazaar/ed25519-verification-key-2020";
import * as vc from "@digitalbazaar/vc";
import { convertValues } from "./utils";
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

export type CredentialsIssuer =
  | Omit<Ed25519VerificationKey2020Options, "type">
  | Ed25519VerificationKey2020;

function isIssuerKey(issuer: CredentialsIssuer): issuer is Ed25519VerificationKey2020 {
  return typeof issuer === "object" && issuer !== null && "type" in issuer;
}

export type Credentials = VerifiableCredential<VerifiableCredentialSubject>;

export async function buildCredentials(
  fields: CredentialFields,
  subject: CredentialSubject,
  issuer: CredentialsIssuer,
): Promise<Credentials> {
  const { residentialAddress, ...subjectData } = subject;

  const credentialSubject = {
    "@context": CONTEXT_IDOS_CREDENTIALS_V1_SUBJECT,
    ...convertValues(subjectData),
    ...(residentialAddress ? convertValues(residentialAddress, "residentialAddress") : {}),
  };

  // Create credentials container
  const credential = {
    "@context": [CONTEXT_V1, CONTEXT_IDOS_CREDENTIALS_V1, CONTEXT_ED25519_SIGNATURE_2020_V1],
    type: ["VerifiableCredential"],
    issuer: issuer.controller,
    ...convertValues(fields),
    credentialSubject,
  };

  let key: Ed25519VerificationKey2020 | undefined;

  if (isIssuerKey(issuer)) {
    key = issuer;
  } else {
    key = await Ed25519VerificationKey2020.from({
      ...issuer,
      type: "Ed25519VerificationKey2020",
    });
  }
  const suite = new Ed25519Signature2020({ key });

  return vc.issue<VerifiableCredentialSubject>({
    credential,
    suite,
    documentLoader: defaultDocumentLoader,
  });
}
