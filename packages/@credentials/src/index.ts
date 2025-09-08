import { buildCredentials, type Credentials } from "./builder";
import { type AvailableIssuerType, base85ToFile, fileToBase85 } from "./utils";
import type {
  CredentialFields,
  CredentialSubject,
  IDDocumentType,
  InsertableIDOSCredential,
  idOSCredential,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "./utils/types";
import { type VerifyCredentialsResult, verifyCredentials } from "./verifier";

export { buildCredentials, verifyCredentials, base85ToFile, fileToBase85 };

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
  VerifyCredentialsResult,
};
