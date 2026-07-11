import { z } from "zod";

import { RootSchema } from "./root";

export const StructuredSchema: z.ZodObject<{
  root: typeof RootSchema;
}> = z.object({
  root: RootSchema,
});

export type StructuredObject = z.infer<typeof StructuredSchema>;
