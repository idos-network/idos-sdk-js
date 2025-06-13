import z from "zod";

export const serverEnvSchema = z.object({
  IDOS_CONSUMER_SIGNER: z.string(),
  IDOS_RECIPIENT_ENC_PRIVATE_KEY: z.string(),
  NOAH_API_URL: z.string(),
  NOAH_API_KEY: z.string(),
  KRAKEN_API_URL: z.string(),
  KRAKEN_CLIENT_ID: z.string(),
  KRAKEN_ISSUER: z.string(),
  KRAKEN_PRIVATE_KEY: z.string(),
  KRAKEN_PUBLIC_KEY_MULTIBASE: z.string(),
  NODE_ENV: z.enum(["development", "test", "production"]),
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
