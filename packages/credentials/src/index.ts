import { type Credentials, type CredentialsIssuer, buildCredentials } from "./builder";
import { type VerifyCredentialsIssuer, verifyCredentials } from "./verifier";

import type {
  CredentialFields,
  CredentialSubject,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "./utils/types";

export { buildCredentials, verifyCredentials };
export type {
  CredentialFields,
  CredentialSubject,
  CredentialsIssuer,
  VerifyCredentialsIssuer,
  Credentials,
  VerifiableCredentialSubject,
  VerifiableCredential,
};
