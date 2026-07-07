import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const RootSchema: z.ZodObject<{
  faceSignUserId: z.ZodString;
}> = z.object({
  faceSignUserId: z.string(),
});

export type Root = z.infer<typeof RootSchema>;
