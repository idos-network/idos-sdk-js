import * as z from "zod";

import { FaceIdV1Schema, type FaceIdV1 } from "../generated/FaceIdV1";
// Current defaults
import { KycV3Schema, type KycV3 } from "../generated/KycV3";
import {
  BuilderSchema as FaceIdV1BuilderSchema,
  type BuilderType as FaceIdV1BuilderType,
} from "../schemas/FaceIdV1";
// Builders
import {
  BuilderSchema as CredentialSubjectV3BuilderSchema,
  type BuilderType as CredentialSubjectV3BuilderType,
} from "../schemas/KycV3";

// Reexport types and schemas
export type { KycV3, KycV3BuilderType, FaceIdV1, FaceIdV1BuilderType };

export {
  FaceIdV1Schema,
  FaceIdV1BuilderSchema,
  CredentialSubjectV3Schema,
  CredentialSubjectV3BuilderSchema,
};

// Export latest types for SDK
export type {
  CredentialSubjectV3 as CredentialSubjectLatest,
  CredentialSubjectV3BuilderType as CredentialSubjectBuilderLatest,
  FaceIdV1 as FaceIdLatest,
  FaceIdV1BuilderType as FaceIdBuilderLatest,
};

export { CredentialSubjectV3Schema as CredentialSubjectLatestSchema };

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

// @context = "idos-credentials-v1.json"
// https://github.com/colinhacks/zod/issues/3751
export const CredentialFieldsSchema: z.ZodObject<{
  id: z.ZodString;
  level: z.ZodString;
  kycLevel: z.ZodNumber;
  issued: z.ZodOptional<z.ZodDate>;
  approvedAt: z.ZodOptional<z.ZodDate>;
  expirationDate: z.ZodOptional<z.ZodDate>;
}> = z.object({
  id: z.string(),

  /* Level of KYC verification performed (e.g., basic, intermediate, advanced). */
  level: z.string(),

  /* Level of KYC verification performed (e.g., 1, 2, 3). */
  kycLevel: z.number(),

  /* @default Date.now() */
  issued: z.date().optional(),

  /* Date the credential was approved. */
  approvedAt: z.date().optional(),

  /* Date the credential was revoked. */
  expirationDate: z.date().optional(),
});

export type CredentialFields = z.infer<typeof CredentialFieldsSchema>;

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
