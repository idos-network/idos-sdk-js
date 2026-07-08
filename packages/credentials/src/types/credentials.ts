// Import all generated types & builders and reexport them

/**
 * KYC - Credential Subject all versions
 *
 * V{n}Schema - Verifiable Credential Subject ZOD schema (flat type! not builder!)
 * V{n} - Verifiable Credential Subject TypeScript type (flat type! not builder! this is the type that would be stored)
 * V{n}BuilderSchema - Verifiable Credential Subject ZOD builder schema (sub-objects for builder, validations)
 * V{n}BuilderType - Verifiable Credential Subject ZOD builder type (sub-objects for builder, validations)
 */
export { KycV1Schema as KycSubjectV1Schema, type KycV1 as KycSubjectV1 } from "../generated/KycV1";
export {
  BuilderSchema as KycSubjectV1BuilderSchema,
  type BuilderType as KycSubjectV1BuilderType,
} from "../schemas/KycV1";
export { KycV2Schema as KycSubjectV2Schema, type KycV2 as KycSubjectV2 } from "../generated/KycV2";
export {
  BuilderSchema as KycSubjectV2BuilderSchema,
  type BuilderType as KycSubjectV2BuilderType,
} from "../schemas/KycV2";
import { KycV3Schema as KycSubjectV3Schema, type KycV3 as KycSubjectV3 } from "../generated/KycV3";
import {
  BuilderSchema as KycSubjectV3BuilderSchema,
  type BuilderType as KycSubjectV3BuilderType,
} from "../schemas/KycV3";

export type { KycSubjectV3, KycSubjectV3BuilderType };
export { KycSubjectV3Schema, KycSubjectV3BuilderSchema };

/**
 * FaceId - Credential Subject for FaceId
 */
import {
  FaceIdV1Schema as FaceIdSubjectV1Schema,
  type FaceIdV1 as FaceIdSubjectV1,
} from "../generated/FaceIdV1";
import {
  BuilderSchema as FaceIdSubjectV1BuilderSchema,
  type BuilderType as FaceIdSubjectV1BuilderType,
} from "../schemas/FaceIdV1";

export type { FaceIdSubjectV1, FaceIdSubjectV1BuilderType };
export { FaceIdSubjectV1Schema, FaceIdSubjectV1BuilderSchema };

/**
 * Credentials container (level, kycLevel, issued, approvedAt, expirationDate...)
 */
export {
  EnvelopeExtensionV1Schema,
  type EnvelopeExtensionV1,
} from "../generated/EnvelopeExtensionV1";
export {
  BuilderSchema as EnvelopeExtensionV1BuilderSchema,
  type BuilderType as EnvelopeExtensionV1BuilderType,
} from "../schemas/EnvelopeExtensionV1";
import {
  EnvelopeExtensionV2Schema,
  type EnvelopeExtensionV2,
} from "../generated/EnvelopeExtensionV2";
import {
  BuilderSchema as EnvelopeExtensionV2BuilderSchema,
  type BuilderType as EnvelopeExtensionV2BuilderType,
} from "../schemas/EnvelopeExtensionV2";

export type { EnvelopeExtensionV2, EnvelopeExtensionV2BuilderType };
export { EnvelopeExtensionV2Schema, EnvelopeExtensionV2BuilderSchema };

/**
 * This would always pointed out to the latest versions of the above types
 */
export type {
  // Credential subject for KYC
  KycSubjectV3 as KycSubjectLatest,
  KycSubjectV3BuilderType as KycSubjectLatestBuilderType,

  // Credential subject for FaceId
  FaceIdSubjectV1 as FaceIdSubjectLatest,
  FaceIdSubjectV1BuilderType as FaceIdSubjectLatestBuilderType,

  // Credential container
  EnvelopeExtensionV2 as EnvelopeExtensionLatest,
  EnvelopeExtensionV2BuilderType as EnvelopeExtensionLatestBuilderType,
};
export {
  // Credential subject for KYC
  KycSubjectV3Schema as KycSubjectLatestSchema,
  KycSubjectV3BuilderSchema as KycSubjectLatestBuilderSchema,

  // Credential subject for FaceId
  FaceIdSubjectV1Schema as FaceIdSubjectLatestSchema,
  FaceIdSubjectV1BuilderSchema as FaceIdSubjectLatestBuilderSchema,

  // Credential container
  EnvelopeExtensionV2Schema as EnvelopeExtensionLatestSchema,
  EnvelopeExtensionV2BuilderSchema as EnvelopeExtensionLatestBuilderSchema,
};

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
