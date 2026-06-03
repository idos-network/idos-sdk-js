import * as z from "zod";

export const commonEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  WALLET_CONNECT_PROJECT_ID: z.string(),
  FACESIGN_ENCLAVE_URL: z.string(),
  NEAR_NETWORK: z.enum(["testnet", "mainnet"]),
  STELLAR_NETWORK: z.enum(["testnet", "public"]),
  DATA_DASHBOARD_URL: z.string().optional(),
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
