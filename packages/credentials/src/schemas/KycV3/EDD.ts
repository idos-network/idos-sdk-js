import { IsIn, IsOptional, IsString } from "class-validator";

import { Occupations, type Occupation } from "../enums";
import { Base85FileField } from "../utils";

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
