export type * from "./credentials";
export * from "./credentials";
export type * from "./issuers";
export * from "./issuers";

// TODO: These should be generated
export { VerifiableCredentialFaceIdV1 } from "../schemas/FaceId/v1";
export { VerifiableCredentialKycV1 } from "../schemas/Kyc/v1";
export { VerifiableCredentialKycV2 } from "../schemas/Kyc/v2";
export { VerifiableCredentialKycV3 } from "../schemas/Kyc/v3";

export type { CredentialSubjectV1 as CredentialSubjectKycV1 } from "../generated/CredentialSubjectV1";
export type { CredentialSubjectV2 as CredentialSubjectKycV2 } from "../generated/CredentialSubjectV2";
export type { CredentialSubjectV3 as CredentialSubjectKycV3 } from "../generated/CredentialSubjectV3";
export type { FaceIdV1 as CredentialSubjectFaceIdV1 } from "../generated/FaceIdV1";
