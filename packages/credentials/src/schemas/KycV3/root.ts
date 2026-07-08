import { z } from "zod";

// https://github.com/colinhacks/zod/issues/3751
export const RootSchema: z.ZodObject<{
  id: z.ZodString;
}> = z.object({
  id: z.string(),
});

export type Root = z.infer<typeof RootSchema>;
