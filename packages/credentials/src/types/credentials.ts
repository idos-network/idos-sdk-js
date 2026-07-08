// Import all generated types & builders and reexport them

/**
 * KYC - Credential Subject all versions
 * 
 * V{n}Schema - Verifiable Credential Subject ZOD schema (flat type! not builder!)
 * V{n} - Verifiable Credential Subject TypeScript type (flat type! not builder! this is the type that would be stored)
 * V{n}BuilderSchema - Verifiable Credential Subject ZOD builder schema (sub-objects for builder, validations)
 * V{n}BuilderType - Verifiable Credential Subject ZOD builder type (sub-objects for builder, validations)
 */
export {
  KycV1Schema as CredentialSubjectKYCV1Schema,
  type KycV1 as CredentialSubjectKYCV1,
} from "../generated/KycV1";
export {
  BuilderSchema as CredentialSubjectKYCV1BuilderSchema,
  type BuilderType as CredentialSubjectKYCV1BuilderType,
} from "../schemas/KycV1";
export {
  KycV2Schema as CredentialSubjectKYCV2Schema,
  type KycV2 as CredentialSubjectKYCV2,
} from "../generated/KycV2";
export {
  BuilderSchema as CredentialSubjectKYCV2BuilderSchema,
  type BuilderType as CredentialSubjectKYCV2BuilderType,
} from "../schemas/KycV2";
import {
  KycV3Schema as CredentialSubjectKYCV3Schema,
  type KycV3 as CredentialSubjectKYCV3,
} from "../generated/KycV3";
import {
  BuilderSchema as CredentialSubjectKYCV3BuilderSchema,
  type BuilderType as CredentialSubjectKYCV3BuilderType,
} from "../schemas/KycV3";

export type { CredentialSubjectKYCV3, CredentialSubjectKYCV3BuilderType }
export { CredentialSubjectKYCV3Schema, CredentialSubjectKYCV3BuilderSchema }

/**
 * FaceId - Credential Subject for FaceId
 */
import {
  FaceIdV1Schema as CredentialSubjectFaceIdV1Schema,
  type FaceIdV1 as CredentialSubjectFaceIdV1,
} from "../generated/FaceIdV1";
import {
  BuilderSchema as CredentialSubjectFaceIdV1BuilderSchema,
  type BuilderType as CredentialSubjectFaceIdV1BuilderType,
} from "../schemas/FaceIdV1";

export type { CredentialSubjectFaceIdV1, CredentialSubjectFaceIdV1BuilderType }
export { CredentialSubjectFaceIdV1Schema, CredentialSubjectFaceIdV1BuilderSchema }

/**
 * Credentials container (level, kycLevel, issued, approvedAt, expirationDate...)
 */
export {
  CredentialsV1Schema as CredentialContainerV1Schema,
  type CredentialsV1 as CredentialContainerV1,
} from "../generated/CredentialsV1";
export {
  BuilderSchema as CredentialContainerV1BuilderSchema,
  type BuilderType as CredentialContainerV1BuilderType,
} from "../schemas/CredentialsV1";
import {
  CredentialsV2Schema as CredentialContainerV2Schema,
  type CredentialsV2 as CredentialContainerV2,
} from "../generated/CredentialsV2";
import {
  BuilderSchema as CredentialContainerV2BuilderSchema,
  type BuilderType as CredentialContainerV2BuilderType,
} from "../schemas/CredentialsV2";

export type { CredentialContainerV2, CredentialContainerV2BuilderType }
export { CredentialContainerV2Schema, CredentialContainerV2BuilderSchema }

/**
 * This would always pointed out to the latest versions of the above types
 */
export type {
  // Credential subject for KYC
  CredentialSubjectKYCV3 as CredentialSubjectKYCLatest,
  CredentialSubjectKYCV3BuilderType as CredentialSubjectKYCLatestBuilderType,

  // Credential subject for FaceId
  CredentialSubjectFaceIdV1 as CredentialSubjectFaceIdLatest,
  CredentialSubjectFaceIdV1BuilderType as CredentialSubjectFaceIdLatestBuilderType,

  // Credential container
  CredentialContainerV2 as CredentialContainerLatest,
  CredentialContainerV2BuilderType as CredentialContainerLatestBuilderType,
}
export {
  // Credential subject for KYC
  CredentialSubjectKYCV3Schema as CredentialSubjectKYCLatestSchema,
  CredentialSubjectKYCV3BuilderSchema as CredentialSubjectKYCLatestBuilderSchema,

  // Credential subject for FaceId
  CredentialSubjectFaceIdV1Schema as CredentialSubjectFaceIdLatestSchema,
  CredentialSubjectFaceIdV1BuilderSchema as CredentialSubjectFaceIdLatestBuilderSchema,

  // Credential container
  CredentialContainerV2Schema as CredentialContainerLatestSchema,
  CredentialContainerV2BuilderSchema as CredentialContainerLatestBuilderSchema,
}

// Other utility types
export type idOSCredential = {
  id: string;
  user_id: string;
  public_notes: string;
  content: string;
  encryptor_public_key: string;
  issuer_auth_public_key: string;
  original_id?: string | null;
};

export type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};

// TODO: This is a stub of the types for @digitalbazaar/vc
// when they introduce TypeScript support we should remove this
// The copy is here because `types.d.ts` file is not bundled.
export interface VerifiedCredentialsProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofValue: string;
  proofPurpose: string;
}

export interface VerifiedCredentials<K> {
  "@context": string[];
  type: string[];
  issuer: string;
  id: string;
  level: string;
  kycLevel: number;
  issued: string;
  approvedAt: string;
  expirationDate: string;
  credentialSubject: K;
  issuanceDate: string;
  proof: VerifiedCredentialsProof;
}

export type VerifiableCredential<K> = VerifiedCredentials<K>;
