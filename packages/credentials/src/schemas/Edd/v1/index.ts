import type { PublicNotes } from "../../types";

import { VerifiableCredentialContainerBase } from "../..";
import { CONTEXT_IDOS_CREDENTIAL_V1, CONTEXT_IDOS_CREDENTIAL_V1_EDD } from "../../../utils/loader";
import {
  StructuredSchema as EnvelopeSchema,
  type StructuredObject as EnvelopeType,
} from "../../envelope/v1/schema";
import { StructuredSchema, type StructuredObject as CredentialSubjectType } from "./schema";

export class VerifiableCredentialEddV1 extends VerifiableCredentialContainerBase<
  EnvelopeType,
  CredentialSubjectType
> {
  constructor() {
    super(
      CONTEXT_IDOS_CREDENTIAL_V1,
      CONTEXT_IDOS_CREDENTIAL_V1_EDD,
      EnvelopeSchema,
      StructuredSchema,
    );
  }

  override level(): string {
    return "edd";
  }

  override publicNotes(): PublicNotes {
    return {
      type: "edd",
      level: this.level(),
    };
  }
}
