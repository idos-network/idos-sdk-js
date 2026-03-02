import * as z from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  IDOS_ISSUER_SECRET_KEY: z.string(),
  IDOS_ISSUER_ENCRYPTION_SECRET_KEY: z.string(),
  SECRET_KEY_BASE: z.string(),
  SECURE_AUTH_COOKIE: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Zod will filter all the keys not specified on the schema */
function buildEnv(): ServerEnv {
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error: unknown) {
    console.error("Warning: invalid server env vars!");
    console.error(error);

    return {} as ServerEnv;
  }
}

export const SERVER_ENV = buildEnv();
