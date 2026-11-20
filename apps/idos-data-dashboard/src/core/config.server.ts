import { COMMON_ENV } from "@/core/envFlags.common";
import { SERVER_ENV } from "@/core/envFlags.server";

/**
 * Server-side URLs that carry the issuer key's signatures, consumer keys or the Relay API key.
 *
 * The server has no page hostname to pick an environment from, so these are still read from the
 * environment, but only idOS's own hosts are accepted: an edited variable can switch between idOS
 * environments, never send a request elsewhere. Anything else fails closed, before any request is made.
 * The development server may also use a loopback URL.
 */
export const ALLOWED_NODE_URLS: readonly string[] = [
  "https://nodes.idos.network",
  "https://nodes.playground.idos.network",
  "https://nodes.staging.idos.network",
];

export const ALLOWED_RELAY_URLS: readonly string[] = [
  "https://relay.idos.network",
  "https://relay.playground.idos.network",
  "https://relay.staging.idos.network",
];

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Returns the URL's origin if it is allowed, and throws otherwise. Paths are not accepted. */
export function assertAllowedUrl(
  name: string,
  raw: string | undefined,
  allowed: readonly string[],
  allowLoopback: boolean = import.meta.env.DEV,
): string {
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    throw new Error(`${name} is not set or is not a URL`);
  }

  const hasPath = url.pathname !== "/" || url.search !== "" || url.hash !== "";
  const isAllowed = allowed.includes(url.origin);
  const isLoopback = allowLoopback && LOOPBACK_HOSTNAMES.has(url.hostname);

  if (hasPath || url.username || url.password || (!isAllowed && !isLoopback)) {
    throw new Error(`${name} points at a host that is not allowed: ${url.host}`);
  }

  return url.origin;
}

/** Node for the issuer-signed profile calls. */
export function serverIdosNodeUrl(): string {
  return assertAllowedUrl("VITE_IDOS_NODE_URL", COMMON_ENV.IDOS_NODE_URL, ALLOWED_NODE_URLS);
}

/** Node for the developer console's consumer calls. */
export function developerConsoleNodeUrl(): string {
  return assertAllowedUrl(
    "VITE_DEVELOPER_CONSOLE_IDOS_NODE_URL",
    COMMON_ENV.DEVELOPER_CONSOLE_IDOS_NODE_URL,
    ALLOWED_NODE_URLS,
  );
}

/** Relay, which receives RELAY_API_KEY as a bearer token. */
export function relayUrl(): string {
  return assertAllowedUrl("RELAY_URL", SERVER_ENV.RELAY_URL, ALLOWED_RELAY_URLS);
}
