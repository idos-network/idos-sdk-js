import invariant from "tiny-invariant";

import { env } from "@/env";

/**
 * The FaceSign enclave's trust anchors, chosen by the hostname the page is served on.
 *
 * These values decide where the user's face scan and permanent mnemonic are sent, and which
 * parent origins may drive the enclave. They live here, in reviewed source, rather than in Vercel
 * environment variables, so that changing them for a deployed environment takes a reviewed
 * commit. Only local development reads them from the environment.
 */
export interface FaceSignConfig {
  facesignServiceUrl: string;
  entropyServiceUrl: string;
  facetecDeviceKeyIdentifier: string;
  facetecIframeFeatureFlag: string;
  allowedOrigins: readonly string[];
}

export type EnvironmentName = "production" | "playground" | "staging";

const FACETEC = {
  // cspell:disable-next-line
  facetecDeviceKeyIdentifier: "daAezC7MmymLklxL6jwaORL17O6y8aUw",
  facetecIframeFeatureFlag: "991d6c1c-5e5c-4e32-89c7-1ddfac46572e",
};

const STAGING_SERVICES = {
  facesignServiceUrl: "https://facesign.tee.staging.idos.network/",
  entropyServiceUrl: "https://entropy.tee.staging.idos.network/",
};

export const CONFIGS: Record<EnvironmentName, FaceSignConfig> = {
  production: {
    facesignServiceUrl: "https://facesign.fractal.id",
    entropyServiceUrl: "https://entropy.fractal.id",
    ...FACETEC,
    allowedOrigins: ["https://app.idos.network", "https://embedded-wallet.idos.network"],
  },
  playground: {
    ...STAGING_SERVICES,
    ...FACETEC,
    allowedOrigins: [
      "https://app.playground.idos.network",
      "https://embedded-wallet.playground.idos.network",
    ],
  },
  staging: {
    ...STAGING_SERVICES,
    ...FACETEC,
    allowedOrigins: [
      "https://app.staging.idos.network",
      "https://embedded-wallet.staging.idos.network",
    ],
  },
};

const HOSTS: Record<string, EnvironmentName> = {
  "facesign.idos.network": "production",
  "facesign.playground.idos.network": "playground",
  "facesign.staging.idos.network": "staging",
};

// Local development: localhost, or a private-network IP (developers open the dev server from
// another device on the LAN, e.g. a phone). Deployed hosts are never IP literals.
const PRIVATE_IPV4 =
  /^(?:10|127)(?:\.\d{1,3}){3}$|^192\.168(?:\.\d{1,3}){2}$|^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$|^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])(?:\.\d{1,3}){2}$/;

export function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || PRIVATE_IPV4.test(hostname);
}

/**
 * Deployed hosts get their fixed configuration and never read the environment. Vercel previews
 * (`*.vercel.app`) get staging. Local development hosts read the environment. Any other host is refused.
 */
export function resolveConfig(hostname: string, localEnv: typeof env = env): FaceSignConfig {
  const name = Object.hasOwn(HOSTS, hostname) ? HOSTS[hostname] : undefined;
  if (name) return CONFIGS[name];
  if (hostname.endsWith(".vercel.app")) return CONFIGS.staging;
  if (isLocalHost(hostname)) return configFromEnv(localEnv);
  throw new Error(`FaceSign has no configuration for host "${hostname}"`);
}

let resolved: FaceSignConfig | undefined;

/** The configuration for the current page. Browser only: route modules also load on the server. */
export function getConfig(): FaceSignConfig {
  invariant(typeof window !== "undefined", "getConfig() is only available in the browser");
  resolved ??= resolveConfig(window.location.hostname);
  return resolved;
}

function configFromEnv(localEnv: typeof env): FaceSignConfig {
  invariant(localEnv.VITE_FACESIGN_SERVICE_URL, "VITE_FACESIGN_SERVICE_URL must be set");
  invariant(localEnv.VITE_ENTROPY_SERVICE_URL, "VITE_ENTROPY_SERVICE_URL must be set");
  invariant(
    localEnv.VITE_FACETEC_DEVICE_KEY_IDENTIFIER,
    "VITE_FACETEC_DEVICE_KEY_IDENTIFIER must be set",
  );
  invariant(
    localEnv.VITE_FACETEC_IFRAME_FEATURE_FLAG,
    "VITE_FACETEC_IFRAME_FEATURE_FLAG must be set",
  );

  return {
    facesignServiceUrl: localEnv.VITE_FACESIGN_SERVICE_URL,
    entropyServiceUrl: localEnv.VITE_ENTROPY_SERVICE_URL,
    facetecDeviceKeyIdentifier: localEnv.VITE_FACETEC_DEVICE_KEY_IDENTIFIER,
    facetecIframeFeatureFlag: localEnv.VITE_FACETEC_IFRAME_FEATURE_FLAG,
    allowedOrigins: parseAllowedOrigins(localEnv.VITE_ALLOWED_ORIGINS),
  };
}

/** Parses VITE_ALLOWED_ORIGINS. Wildcards are not supported: every origin must be listed. */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  const origins = (raw ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.includes("*")) {
    console.error(
      'VITE_ALLOWED_ORIGINS: "*" is not supported and is ignored. List origins explicitly.',
    );
  }

  return origins.filter((o) => o !== "*");
}
