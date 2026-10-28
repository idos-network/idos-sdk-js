import { IsIn, IsMimeType, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

import { BiometricSources, type BiometricSource } from "../enums";
import { Base85FileField } from "../utils";

export class Biometric {
  /* What kind of check took the selfie: an active liveness check (LIVENESS) or a plain photo (SELFIE). Only LIVENESS counts towards the level. */
  @IsIn(BiometricSources)
  source: BiometricSource;

  /* Who ran the check, e.g. the KYC or liveness provider. */
  @IsString()
  @IsNotEmpty()
  provider: string;

  /* The person's selfie image. */
  @Base85FileField()
  selfieFile: Buffer;

  /* Type of the selfie image. */
  @IsString()
  @IsMimeType()
  selfieFileType: string;

  /* Name of the selfie image file. */
  @IsString()
  selfieFileName: string;

  /* A score indicating whether the selfie/liveness photo matches the document photo. */
  @IsOptional()
  @IsNumber()
  selfieMatch?: number;
}
