import { z } from "zod";

import { Base85File } from "../../codecs";

// https://github.com/colinhacks/zod/issues/3751
export const BiometricSchema: z.ZodObject<{
  selfieFile: typeof Base85File;
  selfieMatch: z.ZodOptional<z.ZodNumber>;
}> = z.object({
  /* The person's selfie image. */
  selfieFile: Base85File,

  /* A score or flag indicating whether the selfie/liveness photo matches the identity document photo. */
  selfieMatch: z.number().optional(),
});

export type Biometric = z.infer<typeof BiometricSchema>;
