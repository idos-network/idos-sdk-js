import { IsIn, IsMimeType, IsOptional, IsString } from "class-validator";

import {
  Occupations,
  SourceOfFundsSources,
  type Occupation,
  type SourceOfFundsSource,
} from "../enums";
import { Base85FileField, RequiredWhen } from "../utils";

export class EDD {
  /* The person's occupation or job title. */
  @IsOptional()
  @IsIn(Occupations)
  occupation?: Occupation;

  /* The origin of money used in transactions (e.g. salary, business income, savings). */
  @IsOptional()
  @IsString()
  sourceOfFundsCategory?: string;

  /* How the source of funds was obtained: self-attested by the person (MANUAL) or verified. Required with a proof file. A MANUAL one does not count towards the level. */
  @RequiredWhen((edd: EDD) => !!edd.sourceOfFundsProofFile)
  @IsIn(SourceOfFundsSources)
  sourceOfFundsSource?: SourceOfFundsSource;

  /* A file containing proof of the person's source of funds. */
  @IsOptional()
  @Base85FileField()
  sourceOfFundsProofFile?: Buffer;

  /* Type of the document provided as proof of the person's source of funds. */
  @RequiredWhen((edd: EDD) => !!edd.sourceOfFundsProofFile)
  @IsString()
  @IsMimeType()
  sourceOfFundsProofFileType?: string;

  /* Name of the document provided as proof of the person's source of funds. */
  @RequiredWhen((edd: EDD) => !!edd.sourceOfFundsProofFile)
  @IsString()
  sourceOfFundsProofFileName?: string;
}
