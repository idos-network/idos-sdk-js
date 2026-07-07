import type { PublicNotes } from "../types";

import { CONTEXT_IDOS_CREDENTIAL_V2, CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT } from "../../utils/loader";
import { EnvelopeV2 } from "../Envelope";
import { VerifiableCredentialBase } from "../VerifiableCredential";
import { Subject } from "./Subject";

export class KycV3 extends VerifiableCredentialBase<EnvelopeV2, Subject> {
  static readonly envelopeContext: string = CONTEXT_IDOS_CREDENTIAL_V2;
  static readonly subjectContext: string = CONTEXT_IDOS_CREDENTIAL_V3_SUBJECT;

  constructor() {
    super(EnvelopeV2, Subject);
  }

  override level(): string {
    const { residentialAddress, biometric, contact, edd, sourceOfWealth, screening, onboarding } =
      this.subject;

    // A verified address with a proof is the sign of plus.
    const base =
      residentialAddress?.proofFile &&
      residentialAddress.city &&
      residentialAddress.proofCategory &&
      residentialAddress.verified &&
      residentialAddress.country
        ? "plus"
        : "basic";

    const addons = [
      biometric?.selfieFile && "liveness",
      contact?.email && "email",
      contact?.phoneNumber && "phoneNumber",
      edd && "edd",
      sourceOfWealth && "sow",
      screening && "screening",
      onboarding && "onboarding",
    ].filter(Boolean);

    return [base, ...addons].join("+");
  }

  kycLevel(): number {
    const { person, idDocument, biometric, residentialAddress, sourceOfWealth, onboarding } =
      this.subject;

    let kycLevel = 0;

    // basic+liveness are always at least kycLevel = 1
    if (biometric?.selfieFile && person && idDocument) {
      kycLevel = 1;
    }

    // plus+liveness are always at least kycLevel = 2
    if (kycLevel >= 1 && residentialAddress?.proofFile && residentialAddress.verified) {
      kycLevel = 2;
    }

    // full SOW and onboarding questionnaire are always at least kycLevel = 3
    if (kycLevel >= 2 && sourceOfWealth && onboarding) {
      kycLevel = 3;
    }

    return kycLevel;
  }

  override publicNotes(): PublicNotes {
    const { residentialAddress, idDocument } = this.subject;

    return {
      type: "kyc",
      level: this.level(),
      kycLevel: this.kycLevel(),

      /* Metadata from the credential */
      proofOfResidency:
        residentialAddress?.proofCategory && residentialAddress.verified
          ? {
              category: residentialAddress.proofCategory,
              dateOfIssue: residentialAddress.proofDateOfIssue,
            }
          : undefined,
      proofOfIdentity: idDocument?.type
        ? { type: idDocument.type, dateOfExpiry: idDocument.dateOfExpiry }
        : undefined,
    };
  }

  protected override setMissingFields(): void {
    super.setMissingFields();

    // A kycLevel of 0 means "none reached", which the envelope expresses by omission.
    if (this.envelope.kycLevel === undefined && this.kycLevel() > 0) {
      this.envelope.kycLevel = this.kycLevel();
    }

    this.envelope.expirationDate ??= this.subject.idDocument?.dateOfExpiry;
  }
}
