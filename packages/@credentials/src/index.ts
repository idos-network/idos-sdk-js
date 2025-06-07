import { type Credentials, buildCredentials } from "./builder";
import type { AvailableIssuerType } from "./utils";
import { verifyCredentials } from "./verifier";

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
  AvailableIssuerType,
  Credentials,
  VerifiableCredentialSubject,
  VerifiableCredential,
};
