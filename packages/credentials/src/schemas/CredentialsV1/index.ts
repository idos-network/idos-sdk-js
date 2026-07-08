import { z } from "zod";

import { RootSchema } from "./root";

const mapping: Record<string, z.ZodObject<any>> = {
  root: RootSchema,
};

export const BuilderSchema: z.ZodObject<{
  root: typeof RootSchema;
}> = z.object({
  root: RootSchema,
});

export type BuilderType = z.infer<typeof BuilderSchema>;

export default mapping;
