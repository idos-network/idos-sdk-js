import { z } from "zod";

import { RootSchema } from "./root";

const mapping: Record<string, z.ZodObject<any>> = {
  root: RootSchema,
};

export default mapping;
