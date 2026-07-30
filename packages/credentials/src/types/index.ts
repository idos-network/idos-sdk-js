export type * from "./credentials";
export * from "./credentials";
export type * from "./issuers";
export * from "./issuers";

// TODO: These should be generated
export { VerifiableCredentialFaceIdV1 } from "../schemas/FaceId/v1";
export { VerifiableCredentialKycV1 } from "../schemas/Kyc/v1";
export { VerifiableCredentialKycV2 } from "../schemas/Kyc/v2";
export { VerifiableCredentialKycV3 } from "../schemas/Kyc/v3";

/*
 * Flat (wire) credential subjects, derived from the structured schemas rather than
 * code-generated: `Date`/`Buffer` become strings and sections are prefixed, e.g.
 * `person.firstName` -> `personFirstName`. See `schemas/utils.ts`.
 */
import type { StructuredObject as EddV1Structured } from "../schemas/Edd/v1/schema";
import type { StructuredObject as FaceIdV1Structured } from "../schemas/FaceId/v1/schema";
import type { StructuredObject as KycV1Structured } from "../schemas/Kyc/v1/schema";
import type { StructuredObject as KycV2Structured } from "../schemas/Kyc/v2/schema";
import type { StructuredObject as KycV3Structured } from "../schemas/Kyc/v3/schema";
import type { FlatSubject } from "../schemas/utils";

export type CredentialSubjectKycV1 = FlatSubject<KycV1Structured>;
export type CredentialSubjectKycV2 = FlatSubject<KycV2Structured>;
export type CredentialSubjectKycV3 = FlatSubject<KycV3Structured>;
export type CredentialSubjectFaceIdV1 = FlatSubject<FaceIdV1Structured>;
export type CredentialSubjectEddV1 = FlatSubject<EddV1Structured>;
