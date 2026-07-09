import type { z } from "zod";

import {
  CONTEXT_IDOS_CREDENTIAL_V1,
  CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID,
  CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT,
  CONTEXT_IDOS_CREDENTIAL_V2,
  CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT,
  CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT,
} from "../builder/loader";
import { EnvelopeExtensionV1Schema } from "../generated/EnvelopeExtensionV1";
import { EnvelopeExtensionV2Schema } from "../generated/EnvelopeExtensionV2";
import { FaceIdV1Schema } from "../generated/FaceIdV1";
import { KycV1Schema } from "../generated/KycV1";
import { KycV2Schema } from "../generated/KycV2";
import { KycV3Schema } from "../generated/KycV3";

/**
 * Single source of truth pairing a JSON-LD `@context` URL with the flat Zod
 * schema that validates it, its type and version. Both the parser and any
 * future builder logic should resolve versions through here instead of
 * re-hardcoding the context↔schema mapping.
 *
 * ponytail: keep in sync with cli/generate-schemas.mjs `configuration` when a
 * new schema version is generated — one entry per generated context.
 */
export type SubjectRegistryEntry = {
  context: string;
  type: "kyc" | "faceId";
  version: string;
  schema: z.ZodObject;
};

export type EnvelopeRegistryEntry = {
  context: string;
  version: string;
  schema: z.ZodObject;
};

export const SUBJECT_REGISTRY: readonly SubjectRegistryEntry[] = [
  { context: CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT, type: "kyc", version: "v1", schema: KycV1Schema },
  { context: CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT, type: "kyc", version: "v2", schema: KycV2Schema },
  { context: CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT, type: "kyc", version: "v3", schema: KycV3Schema },
  {
    context: CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID,
    type: "faceId",
    version: "v1",
    schema: FaceIdV1Schema,
  },
];

export const ENVELOPE_REGISTRY: readonly EnvelopeRegistryEntry[] = [
  { context: CONTEXT_IDOS_CREDENTIAL_V1, version: "v1", schema: EnvelopeExtensionV1Schema },
  { context: CONTEXT_IDOS_CREDENTIAL_V2, version: "v2", schema: EnvelopeExtensionV2Schema },
];
