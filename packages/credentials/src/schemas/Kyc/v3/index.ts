import type { CredentialSubjectV3 } from "../../../generated/CredentialSubjectV3";
import type { PublicNotes } from "../../types";

import { VerifiableCredentialContainerBase } from "../..";
import {
  CONTEXT_IDOS_CREDENTIAL_V2,
  CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT,
} from "../../../utils/loader";
import {
  StructuredSchema as EnvelopeSchema,
  type StructuredObject as EnvelopeType,
} from "../../envelope/v2/schema";
import { StructuredSchema, type StructuredObject as CredentialSubjectType } from "./schema";
import { deriveLevel, deriveKYCLevel, derivePublicNotes, deriveExpirationDate } from "./utils";

export class VerifiableCredentialKycV3 extends VerifiableCredentialContainerBase<
  EnvelopeType,
  CredentialSubjectType,
  CredentialSubjectV3
> {
  constructor() {
    super(
      CONTEXT_IDOS_CREDENTIAL_V2,
      CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT,
      EnvelopeSchema,
      StructuredSchema,
    );
  }

  setMandatoryEnvelopeFields(fields: Omit<EnvelopeType, "level" | "kycLevel">): void {
    EnvelopeSchema.omit({ level: true, kycLevel: true }).parse(fields);
    this.envelope = fields;
  }

  override level(): string {
    return deriveLevel(this.subject);
  }

  kycLevel(): number {
    return deriveKYCLevel(this.subject);
  }

  override publicNotes(): PublicNotes {
    return derivePublicNotes(this.subject);
  }

  override setMissingFields(): void {
    super.setMissingFields();

    if (!this.envelope.kycLevel) {
      this.envelope.kycLevel = this.kycLevel();
    }

    if (!this.envelope.expirationDate && deriveExpirationDate(this.subject)) {
      this.envelope.expirationDate = deriveExpirationDate(this.subject);
    }
  }
}
