import { IsIn, IsNumber, IsOptional, Max, Min } from "class-validator";

import {
  ScreeningResults,
  ScreeningSources,
  type ScreeningResult,
  type ScreeningSource,
} from "../enums";

export class Screening {
  /* How the screening was done: checked against sanctions and PEP databases (DB). */
  @IsIn(ScreeningSources)
  source: ScreeningSource;

  /* Whether the person appears on any sanctions lists (e.g. CLEAR, NOT_CHECKED). */
  @IsIn(ScreeningResults)
  sanctionsCheckResult: ScreeningResult;

  /* A confidence score (0–100) for the sanctions screening result. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sanctionsConfidenceScore?: number;

  /* The result of the PEP (Politically Exposed Person) screening check. */
  @IsIn(ScreeningResults)
  pepCheckResult: ScreeningResult;

  /* A confidence score (0–100) for the PEP screening result. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pepConfidenceScore?: number;
}
