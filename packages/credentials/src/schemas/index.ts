export * from "./enums";

export type { Sections, OwnFields } from "./VerifiableCredential";
export { VerifiableCredentialBase } from "./VerifiableCredential";
export type { PublicNotes } from "./types";

export { EnvelopeV1, EnvelopeV2 } from "./Envelope";
export { EddV1 as VerifiableCredentialEddV1 } from "./EddV1";
export { EddV2 as VerifiableCredentialEddV2 } from "./EddV2";
export { FaceIdV1 as VerifiableCredentialFaceIdV1 } from "./FaceIdV1";
export { KycV1 as VerifiableCredentialKycV1 } from "./KycV1";
export { KycV2 as VerifiableCredentialKycV2 } from "./KycV2";

export { KycV3 as VerifiableCredentialKycV3 } from "./KycV3";
export { KycV4 as VerifiableCredentialKycV4 } from "./KycV4";
export { Subject as VerifiableCredentialKycV3Subject } from "./KycV3/Subject";
