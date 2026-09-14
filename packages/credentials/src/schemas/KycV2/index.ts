import type { PublicNotes } from "../types";

import { CONTEXT_IDOS_CREDENTIAL_V2, CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT } from "../../utils/loader";
import { EnvelopeV2 } from "../Envelope";
import { VerifiableCredentialBase } from "../VerifiableCredential";
import { Subject } from "./Subject";

/*
 * v2 derives its level the same way as v1; what changed is the subject context and the
 * envelope, which gained `kycLevel` and the issuance dates — declared in v2's own,
 * separately protected envelope context.
 */
export class KycV2 extends VerifiableCredentialBase<EnvelopeV2, Subject> {
  static readonly envelopeContext: string = CONTEXT_IDOS_CREDENTIAL_V2;
  static readonly subjectContext: string = CONTEXT_IDOS_CREDENTIAL_V2_SUBJECT;

  constructor() {
    super(EnvelopeV2, Subject);
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
