import { IsString } from "class-validator";

import type { PublicNotes } from "../types";

import { CONTEXT_IDOS_CREDENTIAL_V1, CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID } from "../../utils/loader";
import { EnvelopeV1 } from "../Envelope";
import { VerifiableCredentialBase } from "../VerifiableCredential";

/*
 * One field and no sections, so the subject lives here rather than in a file of its own.
 * No `id`: unlike the other versions, this subject has never declared one.
 */
export class Subject {
  @IsString()
  faceSignUserId: string;
}

export class FaceIdV1 extends VerifiableCredentialBase<EnvelopeV1, Subject> {
  static readonly envelopeContext: string = CONTEXT_IDOS_CREDENTIAL_V1;
  static readonly subjectContext: string = CONTEXT_IDOS_CREDENTIAL_V1_FACE_ID;

  constructor() {
    super(EnvelopeV1, Subject);
  }

  override level(): string {
    return "human";
  }

  override publicNotes(): PublicNotes {
    return { type: "pop", level: this.level() };
  }
}
