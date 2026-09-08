import { IsDefined, IsIn, IsOptional, IsString } from "class-validator";

import type { PublicNotes } from "../types";

import { CONTEXT_IDOS_CREDENTIAL_V1, CONTEXT_IDOS_CREDENTIAL_V1_EDD } from "../../utils/loader";
import { Occupations, type Occupation } from "../enums";
import { EnvelopeV1 } from "../Envelope";
import { Base85FileField, Section } from "../utils";
import { VerifiableCredentialBase } from "../VerifiableCredential";

/** The same fields as KycV3's `edd` section, here as a credential of its own. */
export class EDD {
  /* The person's occupation or job title. */
  @IsOptional()
  @IsIn(Occupations)
  occupation?: Occupation;

  /* The origin of money used in transactions (e.g. salary, business income, savings). */
  @IsOptional()
  @IsString()
  sourceOfFundsCategory?: string;

  /* A file containing proof of the person's source of funds. */
  @IsOptional()
  @Base85FileField()
  sourceOfFundsProofFile?: Buffer;
}

export class Subject {
  @IsString()
  id: string;

  @Section(() => EDD)
  @IsDefined()
  edd: EDD;
}

export class EddV1 extends VerifiableCredentialBase<EnvelopeV1, Subject> {
  static readonly envelopeContext: string = CONTEXT_IDOS_CREDENTIAL_V1;
  static readonly subjectContext: string = CONTEXT_IDOS_CREDENTIAL_V1_EDD;

  constructor() {
    super(EnvelopeV1, Subject);
  }

  override level(): string {
    return "edd";
  }

  override publicNotes(): PublicNotes {
    return { type: "edd", level: this.level() };
  }
}
