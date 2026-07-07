import { z } from "zod";

import { EDDSchema } from "./edd";
import { RootSchema } from "./root";

export const StructuredSchema: z.ZodObject<{
  root: typeof RootSchema;
  edd: typeof EDDSchema;
}> = z.object({
  root: RootSchema,
  edd: EDDSchema,
});

export type StructuredObject = z.infer<typeof StructuredSchema>;
