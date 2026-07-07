import type { FaceIdV1 } from "../../../generated/FaceIdV1";

import { VerifiableCredentialContainerBase } from "../..";
import {
  CONTEXT_IDOS_CREDENTIAL_V1,
  CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID,
} from "../../../utils/loader";
import {
  StructuredSchema as EnvelopeSchema,
  type StructuredObject as EnvelopeType,
} from "../../envelope/v1/schema";
import { StructuredSchema, type StructuredObject as CredentialSubjectType } from "./schema";

export class VerifiableCredentialFaceIdV1 extends VerifiableCredentialContainerBase<
  EnvelopeType,
  CredentialSubjectType,
  FaceIdV1
> {
  constructor() {
    super(
      CONTEXT_IDOS_CREDENTIAL_V1,
      CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID,
      EnvelopeSchema,
      StructuredSchema,
    );
  }

  override level(): string {
    return "human";
  }
}
