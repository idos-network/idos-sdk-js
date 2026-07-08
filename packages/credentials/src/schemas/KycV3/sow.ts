import { z } from "zod";

import { SourceOfWealthTypeSchema } from "./enums";

// https://github.com/colinhacks/zod/issues/3751
export const SourceOfWealthSchema: z.ZodObject<{
  type: typeof SourceOfWealthTypeSchema;
}> = z.object({
  /* Categories/types of wealth sources declared by the person (e.g. employment, inheritance, investments). */
  type: SourceOfWealthTypeSchema,
});

export type SourceOfWealth = z.infer<typeof SourceOfWealthSchema>;
