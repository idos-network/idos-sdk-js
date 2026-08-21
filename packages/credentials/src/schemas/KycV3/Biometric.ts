import { IsNumber, IsOptional } from "class-validator";

import { Base85FileField } from "../utils";

export class Biometric {
  /* The person's selfie image. */
  @Base85FileField()
  selfieFile: Buffer;

  /* A score indicating whether the selfie/liveness photo matches the document photo. */
  @IsOptional()
  @IsNumber()
  selfieMatch?: number;
}
