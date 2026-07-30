import { VerifiableCredentialContainerBase } from "../..";
import {
  CONTEXT_IDOS_CREDENTIAL_V1,
  CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT,
} from "../../../utils/loader";
import {
  StructuredSchema as EnvelopeSchema,
  type StructuredObject as EnvelopeType,
} from "../../envelope/v1/schema";
import { StructuredSchema, type StructuredObject as CredentialSubjectType } from "./schema";
import { deriveLevel } from "./utils";

export class VerifiableCredentialKycV1 extends VerifiableCredentialContainerBase<
  EnvelopeType,
  CredentialSubjectType
> {
  constructor() {
    super(
      CONTEXT_IDOS_CREDENTIAL_V1,
      CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT,
      EnvelopeSchema,
      StructuredSchema,
    );
  }

  override level(): string {
    return deriveLevel(this.subject);
  }
}
