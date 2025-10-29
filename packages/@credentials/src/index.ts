import {
  buildCredential,
  buildFaceIdCredential,
  type Credential,
  credentialFaceIdSubjectConverter,
  credentialSubjectConverter,
  type FaceIdCredential,
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
import { type VerifyCredentialResult, verifyCredential } from "./verifier";

export {
  buildCredential,
  buildFaceIdCredential,
  credentialSubjectConverter,
  credentialFaceIdSubjectConverter,
  verifyCredential,
  base85ToFile,
  fileToBase85,
};

export type {
  CredentialFields,
  CredentialSubject,
  CredentialSubjectFaceId,
  AvailableIssuerType,
  Credential,
  FaceIdCredential,
  IDDocumentType,
  VerifiableCredentialSubject,
  VerifiableCredential,
  idOSCredential,
  InsertableIDOSCredential,
  VerifyCredentialResult,
};
