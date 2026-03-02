import * as z from "zod";

export const commonEnvSchema = z.object({
  IDOS_NODE_URL: z.string(),
  IDOS_ENCLAVE_URL: z.string(),
  FACESIGN_ENCLAVE_URL: z.string().optional(),
  EMBEDDED_WALLET_APP_URLS: z.string(),
  WALLET_CONNECT_PROJECT_ID: z.string(),
  IDOS_NEAR_DEFAULT_CONTRACT_ID: z.string(),
  DEV: z.boolean().default(false),
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
      DEV: envWithoutPrefix.NODE_ENV === "development" || envWithoutPrefix.DEV,
    });
  } catch (error: unknown) {
    console.error("Warning: invalid client env vars!");
    console.error(error);

    return {} as CommonEnv;
  }
}

export const COMMON_ENV = buildEnv();
