import type { PublicNotes } from "../types";

import { CONTEXT_IDOS_CREDENTIAL_V1, CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT } from "../../utils/loader";
import { EnvelopeV1 } from "../Envelope";
import { VerifiableCredentialBase } from "../VerifiableCredential";
import { Subject } from "./Subject";

export class KycV1 extends VerifiableCredentialBase<EnvelopeV1, Subject> {
  static readonly envelopeContext: string = CONTEXT_IDOS_CREDENTIAL_V1;
  static readonly subjectContext: string = CONTEXT_IDOS_CREDENTIAL_V1_SUBJECT;

  constructor() {
    super(EnvelopeV1, Subject);
  }

  override level(): string {
    const { residentialAddress, selfieFile, email, phoneNumber } = this.subject;

    // A complete address proof is the sign of plus.
    const base =
      residentialAddress?.proofFile &&
      residentialAddress.city &&
      residentialAddress.proofCategory &&
      residentialAddress.country
        ? "plus"
        : "basic";

    const addons = [
      selfieFile && "liveness",
      email && "email",
      phoneNumber && "phoneNumber",
    ].filter(Boolean);

    return [base, ...addons].join("+");
  }

  override publicNotes(): PublicNotes {
    return { type: "kyc", level: this.level() };
  }
}
