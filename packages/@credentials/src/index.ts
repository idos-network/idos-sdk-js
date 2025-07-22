import { buildCredentials, type Credentials } from "./builder";
import type { AvailableIssuerType } from "./utils";
import type {
  CredentialFields,
  CredentialSubject,
  IDDocumentType,
  InsertableIDOSCredential,
  idOSCredential,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "./utils/types";
import { verifyCredentials } from "./verifier";

export { buildCredentials, verifyCredentials };
export type {
  CredentialFields,
  CredentialSubject,
  AvailableIssuerType,
  Credentials,
  IDDocumentType,
  VerifiableCredentialSubject,
  VerifiableCredential,
  idOSCredential,
  InsertableIDOSCredential,
};
