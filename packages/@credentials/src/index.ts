import {
  buildCredentials,
  buildFaceIdCredentials,
  type Credentials,
  type FaceIdCredentials,
} from "./builder";
import { type AvailableIssuerType, base85ToFile, fileToBase85 } from "./utils";
import type {
  CredentialFields,
  CredentialSubject,
  CredentialSubjectFaceId,
  IDDocumentType,
  InsertableIDOSCredential,
  idOSCredential,
  VerifiableCredential,
  VerifiableCredentialSubject,
} from "./utils/types";
import { type VerifyCredentialsResult, verifyCredentials } from "./verifier";

export { buildCredentials, buildFaceIdCredentials, verifyCredentials, base85ToFile, fileToBase85 };

export type {
  CredentialFields,
  CredentialSubject,
  CredentialSubjectFaceId,
  AvailableIssuerType,
  Credentials,
  FaceIdCredentials,
  IDDocumentType,
  VerifiableCredentialSubject,
  VerifiableCredential,
  idOSCredential,
  InsertableIDOSCredential,
  VerifyCredentialsResult,
};
