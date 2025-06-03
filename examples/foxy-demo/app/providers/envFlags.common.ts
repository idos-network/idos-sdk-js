import z from "zod";

export const commonEnvSchema = z.object({
  KRAKEN_API_URL: z.string(),
  IDOS_NODE_URL: z.string(),
  KRAKEN_ISSUER_PUBLIC_KEY: z.string(),
  IDOS_ENCRYPTION_PUBLIC_KEY: z.string(),
  IDOS_PUBLIC_KEY: z.string(),
});

export type CommonEnv = z.infer<typeof commonEnvSchema>;

/** Zod will filter all the keys not specified on the schema */
function buildEnv(): CommonEnv {
  try {
    // Remove VITE_ prefix from all environment variables
    const envWithoutPrefix = Object.entries(import.meta.env).reduce(
      (acc, [key, value]) => {
        if (key.startsWith("VITE_")) {
          acc[key.replace("VITE_", "")] = value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    return commonEnvSchema.parse(envWithoutPrefix);
  } catch (error: unknown) {
    console.error("Warning: invalid client env vars!");
    console.error(error);

    return {} as CommonEnv;
  }
}

export const COMMON_ENV = buildEnv();
