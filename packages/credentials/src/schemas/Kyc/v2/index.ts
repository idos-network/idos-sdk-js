import type { CredentialSubjectV2 } from "../../../generated/CredentialSubjectV2";

import { VerifiableCredentialContainerBase } from "../..";
import {
  CONTEXT_IDOS_CREDENTIAL_V1,
  CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT,
} from "../../../utils/loader";
import {
  StructuredSchema as EnvelopeSchema,
  type StructuredObject as EnvelopeType,
} from "../../envelope/v2/schema";
import { StructuredSchema, type StructuredObject as CredentialSubjectType } from "./schema";
import { deriveLevel } from "./utils";

export class VerifiableCredentialKycV2 extends VerifiableCredentialContainerBase<
  EnvelopeType,
  CredentialSubjectType,
  CredentialSubjectV2
> {
  constructor() {
    super(
      CONTEXT_IDOS_CREDENTIAL_V1,
      CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT,
      EnvelopeSchema,
      StructuredSchema,
    );
  }

  override level(): string {
    return deriveLevel(this.subject);
  }
}
