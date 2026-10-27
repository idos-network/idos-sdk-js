import type { Claims } from "../../utils";
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
    const {
      residentialAddress,
      biometric,
      contact,
      edd,
      sourceOfWealth,
      screening,
      onboarding,
      person,
      idDocument,
    } = this.subject;

    // A verified address with a proof is the sign of plus.
    let base = "unverified";

    // When we have a idDocument and person, we can set "basic"
    if (person && idDocument) {
      base = "basic";
    }

    // When we also have a verified address, we can set "plus"
    if (
      base === "basic" &&
      residentialAddress?.proofFile &&
      residentialAddress.city &&
      residentialAddress.proofCategory &&
      residentialAddress.source === "PROOF_OF_ADDRESS" &&
      residentialAddress.country
    ) {
      base = "plus";
    }

    const addons = [
      biometric?.selfieFile && "liveness",
      contact?.email && contact.emailSource !== "MANUAL" && "email",
      contact?.phoneNumber && contact.phoneNumberSource !== "MANUAL" && "phoneNumber",
      edd && edd.sourceOfFundsSource !== "MANUAL" && "edd",
      sourceOfWealth && sourceOfWealth.source !== "MANUAL" && "sow",
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
    if (
      kycLevel >= 1 &&
      residentialAddress?.proofFile &&
      residentialAddress.source === "PROOF_OF_ADDRESS"
    ) {
      kycLevel = 2;
    }

    // full SOW and onboarding questionnaire are always at least kycLevel = 3
    if (kycLevel >= 2 && sourceOfWealth && sourceOfWealth.source !== "MANUAL" && onboarding) {
      kycLevel = 3;
    }

    return kycLevel;
  }

  /**
   * What the credential claims and how each claim was obtained, so consumers can match on it
   * with `matchClaims`, self-attested (MANUAL) data included. The level only counts verified
   * data. Sections without a source of their own count as verified, as they do in the level.
   */
  claims(): Claims {
    const {
      person,
      idDocument,
      biometric,
      residentialAddress,
      contact,
      edd,
      sourceOfWealth,
      screening,
      onboarding,
    } = this.subject;

    const claims: Claims = {};
    if (person && idDocument) claims.identity = "VERIFIED";
    if (biometric?.selfieFile) claims.liveness = "VERIFIED";
    if (residentialAddress) claims.address = residentialAddress.source;
    // A contact without a source predates the field and counts as verified, as in level().
    if (contact?.email) claims.email = contact.emailSource ?? "VERIFIED";
    if (contact?.phoneNumber) claims.phoneNumber = contact.phoneNumberSource ?? "VERIFIED";
    if (edd) claims.edd = edd.sourceOfFundsSource;
    if (sourceOfWealth) claims.sow = sourceOfWealth.source;
    if (screening) claims.screening = screening.source;
    // The onboarding questionnaire is filled in by the person, so it is always self-attested.
    if (onboarding) claims.onboarding = "MANUAL";
    return claims;
  }

  override publicNotes(): PublicNotes {
    return {
      type: "kyc",
      level: this.level(),
      kycLevel: this.kycLevel(),
      claims: this.claims(),
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
