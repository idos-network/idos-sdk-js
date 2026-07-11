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
import { RootSchema } from "./root";
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

  checkValidity(): void {
    EnvelopeSchema.parse(this.envelope);
    RootSchema.parse(this.subject.root);
  }

  setMandatoryEnvelopeFields(fields: EnvelopeType): void {
    EnvelopeSchema.parse(fields);
    this.envelope = fields;
  }

  setMandatoryFields(root: CredentialSubjectType["root"]): void {
    RootSchema.parse(root);
    this.subject.root = root;
  }
}
