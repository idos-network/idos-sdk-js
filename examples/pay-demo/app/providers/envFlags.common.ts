import * as z from "zod";

export const commonEnvSchema = z.object({
  IDOS_ENCRYPTION_PUBLIC_KEY: z.string(),
  IDOS_NODE_URL: z.string(),
  IDOS_PUBLIC_KEY: z.string(),
  RELAY_API_URL: z.string(),
  RELAY_LEVEL: z.string(),
  RELAY_ENCRYPTION_PUBLIC_KEY: z.string(),
  RELAY_PUBLIC_KEY: z.string(),
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

    return commonEnvSchema.parse({
      ...envWithoutPrefix,
      RELAY_LEVEL: envWithoutPrefix.RELAY_LEVEL ?? "plus+liveness+idos",
    });
  } catch (error: unknown) {
    console.error("Warning: invalid client env vars!");
    console.error(error);

    return {} as CommonEnv;
  }
}

export const COMMON_ENV = buildEnv();
