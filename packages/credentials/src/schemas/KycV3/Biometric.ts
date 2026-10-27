import { IsMimeType, IsNumber, IsOptional, IsString } from "class-validator";

import { Base85FileField } from "../utils";

export class Biometric {
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
