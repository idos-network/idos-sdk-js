import invariant from "tiny-invariant";

import { COMMON_ENV, type CommonEnv } from "@/core/envFlags.common";

/**
 * Where the dashboard sends users' keys and passwords, chosen by the hostname the page is served on.
 *
 * The enclave URLs decide which page receives the user's encryption password and FaceSign mnemonic,
 * the node URL decides which idOS node the browser talks to, and the embedded-wallet URLs decide whose
 * wallet signatures the dashboard accepts. They live here, in reviewed source, rather than in Vercel
 * environment variables, so that changing them for a deployed environment takes a reviewed commit.
 * Only local development reads them from the environment.
 *
 * Server code has no page hostname: see `config.server.ts`.
 */
export interface DashboardConfig {
  idosNodeUrl: string;
  idosEnclaveUrl: string;
  faceSignEnclaveUrl?: string;
  /** The first entry is the popup URL; every entry's origin may answer an add-wallet request. */
  embeddedWalletAppUrls: readonly string[];
}

export type EnvironmentName = "production" | "playground" | "staging";

export const CONFIGS: Record<EnvironmentName, DashboardConfig> = {
  production: {
    idosNodeUrl: "https://nodes.idos.network",
    idosEnclaveUrl: "https://enclave.idos.network",
    embeddedWalletAppUrls: ["https://embedded-wallet.idos.network"],
  },
  playground: {
    idosNodeUrl: "https://nodes.playground.idos.network",
    idosEnclaveUrl: "https://enclave.playground.idos.network",
    embeddedWalletAppUrls: ["https://embedded-wallet.playground.idos.network"],
  },
  staging: {
    idosNodeUrl: "https://nodes.staging.idos.network",
    idosEnclaveUrl: "https://enclave.staging.idos.network",
    embeddedWalletAppUrls: ["https://embedded-wallet.staging.idos.network"],
  },
};

// The `dashboard.*` domains only redirect to these, so they never serve the app.
const HOSTS: Record<string, EnvironmentName> = {
  "app.idos.network": "production",
  "app.playground.idos.network": "playground",
  "app.staging.idos.network": "staging",
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
): DashboardConfig {
  const name = Object.hasOwn(HOSTS, hostname) ? HOSTS[hostname] : undefined;
  if (name) return CONFIGS[name];
  if (hostname.endsWith(".vercel.app")) return CONFIGS.staging;
  if (isLocalHost(hostname)) return configFromEnv(localEnv);
  throw new Error(`The idOS dashboard has no configuration for host "${hostname}"`);
}

let resolved: DashboardConfig | undefined;

/** The configuration for the current page. Browser only: route modules also load on the server. */
export function getConfig(): DashboardConfig {
  invariant(typeof window !== "undefined", "getConfig() is only available in the browser");
  resolved ??= resolveConfig(window.location.hostname);
  return resolved;
}

/**
 * Whether FaceSign is offered. Safe to call while rendering on the server, where it must agree with the
 * browser to avoid a hydration mismatch: FaceSign is turned off on every deployed environment (no
 * `faceSignEnclaveUrl` in `CONFIGS`), so a production build's server says no, and only local development
 * depends on the environment. To turn it back on, restore the URLs in `CONFIGS` and return true here.
 */
export function isFaceSignEnabled(): boolean {
  if (typeof window !== "undefined") return !!getConfig().faceSignEnclaveUrl;
  return import.meta.env.DEV ? !!COMMON_ENV.FACESIGN_ENCLAVE_URL : false;
}

function configFromEnv(localEnv: Partial<CommonEnv>): DashboardConfig {
  invariant(localEnv.IDOS_NODE_URL, "VITE_IDOS_NODE_URL must be set");
  invariant(localEnv.IDOS_ENCLAVE_URL, "VITE_IDOS_ENCLAVE_URL must be set");

  return {
    idosNodeUrl: localEnv.IDOS_NODE_URL,
    idosEnclaveUrl: localEnv.IDOS_ENCLAVE_URL,
    faceSignEnclaveUrl: localEnv.FACESIGN_ENCLAVE_URL || undefined,
    embeddedWalletAppUrls: (localEnv.EMBEDDED_WALLET_APP_URLS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
