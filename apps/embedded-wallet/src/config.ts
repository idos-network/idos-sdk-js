import { COMMON_ENV, type CommonEnv } from "./components/envFlags.common";

/**
 * The embedded wallet's trust anchors, chosen by the hostname the page is served on.
 *
 * The dashboard URL is the only origin the wallet accepts add-wallet messages from and sends wallet
 * signatures to, and the FaceSign URL decides which page runs the face scan and holds the mnemonic.
 * They live here, in reviewed source, rather than in Vercel environment variables, so that changing them
 * for a deployed environment takes a reviewed commit. Only local development reads them from the
 * environment.
 */
export interface WalletConfig {
  dataDashboardUrl?: string;
  faceSignEnclaveUrl?: string;
}

export type EnvironmentName = "production" | "playground" | "staging";

export const CONFIGS: Record<EnvironmentName, WalletConfig> = {
  production: {
    dataDashboardUrl: "https://app.idos.network",
    faceSignEnclaveUrl: "https://facesign.idos.network",
  },
  playground: {
    dataDashboardUrl: "https://app.playground.idos.network",
    faceSignEnclaveUrl: "https://facesign.playground.idos.network",
  },
  staging: {
    dataDashboardUrl: "https://app.staging.idos.network",
    faceSignEnclaveUrl: "https://facesign.staging.idos.network",
  },
};

const HOSTS: Record<string, EnvironmentName> = {
  "embedded-wallet.idos.network": "production",
  "embedded-wallet.playground.idos.network": "playground",
  "embedded-wallet.staging.idos.network": "staging",
};

// Local development: localhost, IPv6 loopback, or a private-network IP (developers open the dev server from
// another device on the LAN, e.g. a phone). Deployed hosts are never IP literals.
const PRIVATE_IPV4 =
  /^(?:10|127)(?:\.\d{1,3}){3}$|^192\.168(?:\.\d{1,3}){2}$|^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$|^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])(?:\.\d{1,3}){2}$/;

export function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "[::1]" || PRIVATE_IPV4.test(hostname);
}

/**
 * Deployed hosts get their fixed configuration and never read the environment. Vercel previews
 * (`*.vercel.app`) get staging. Local development hosts read the environment. Any other host is refused.
 */
export function resolveConfig(
  hostname: string,
  localEnv: Partial<CommonEnv> = COMMON_ENV,
): WalletConfig {
  const name = Object.hasOwn(HOSTS, hostname) ? HOSTS[hostname] : undefined;
  if (name) return CONFIGS[name];
  if (hostname.endsWith(".vercel.app")) return CONFIGS.staging;
  if (isLocalHost(hostname)) {
    return {
      dataDashboardUrl: localEnv.DATA_DASHBOARD_URL || undefined,
      faceSignEnclaveUrl: localEnv.FACESIGN_ENCLAVE_URL || undefined,
    };
  }
  throw new Error(`The embedded wallet has no configuration for host "${hostname}"`);
}

let resolved: WalletConfig | undefined;

/** The configuration for the current page. */
export function getConfig(): WalletConfig {
  resolved ??= resolveConfig(window.location.hostname);
  return resolved;
}
