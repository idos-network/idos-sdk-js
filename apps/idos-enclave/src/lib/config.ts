import type { EncryptionPasswordStore } from "@idos-network/enclave";
import type { LocalEnclaveOptions } from "@idos-network/enclave/local";

/**
 * The idOS enclave's MPC trust anchors, chosen by the hostname the page is served on.
 *
 * The reader node and contract decide which engines receive a user's password shares, and the
 * thresholds decide how many of them can rebuild it. They live here, in reviewed source, rather
 * than in Vercel environment variables, so that changing them for a deployed environment takes a
 * reviewed commit. Only local development reads them from the environment.
 */
export type MpcConfiguration = NonNullable<LocalEnclaveOptions["mpcConfiguration"]>;

export interface EnclaveConfig {
  allowedEncryptionStores: EncryptionPasswordStore[];
  mpcConfiguration?: MpcConfiguration;
}

export type EnvironmentName = "production" | "playground" | "staging";

export type LocalEnv = Partial<
  Record<
    | "VITE_ENABLE_MPC"
    | "VITE_MPC_READER_NODE_URL"
    | "VITE_MPC_CONTRACT_ADDRESS"
    | "VITE_MPC_NUM_MALICIOUS"
    | "VITE_MPC_NUM_NODES"
    | "VITE_MPC_NUM_TO_RECONSTRUCT",
    string
  >
>;

const MPC_STORES: EncryptionPasswordStore[] = ["mpc", "user"];

export const CONFIGS: Record<EnvironmentName, EnclaveConfig> = {
  production: {
    allowedEncryptionStores: MPC_STORES,
    mpcConfiguration: {
      nodeUrl: "https://partisia-reader-node.idos.network:8080",
      // cspell:disable-next-line
      contractAddress: "02b4a0a1bf8dd39b05f9082d60e992e7c455e1f957",
      numMalicious: 2,
      numNodes: 6,
      numToReconstruct: 4,
    },
  },
  playground: {
    allowedEncryptionStores: MPC_STORES,
    mpcConfiguration: {
      nodeUrl: "https://partisia-reader-node.playground.idos.network:8080",
      // cspell:disable-next-line
      contractAddress: "0223996d84146dbf310dd52a0e1d103e91bb8402b3",
      numMalicious: 2,
      numNodes: 6,
      numToReconstruct: 4,
    },
  },
  staging: {
    allowedEncryptionStores: MPC_STORES,
    mpcConfiguration: {
      nodeUrl: "https://partisia-reader-node.playground.idos.network:8080",
      // cspell:disable-next-line
      contractAddress: "0205556500265d454230145b59bd8f6b2632a54d6d",
      numMalicious: 2,
      numNodes: 4,
      numToReconstruct: 2,
    },
  },
};

const HOSTS: Record<string, EnvironmentName> = {
  "enclave.idos.network": "production",
  "enclave.playground.idos.network": "playground",
  "enclave.staging.idos.network": "staging",
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
export function resolveConfig(
  hostname: string,
  localEnv: LocalEnv = import.meta.env as LocalEnv,
): EnclaveConfig {
  const name = Object.hasOwn(HOSTS, hostname) ? HOSTS[hostname] : undefined;
  if (name) return CONFIGS[name];
  if (hostname.endsWith(".vercel.app")) return CONFIGS.staging;
  if (isLocalHost(hostname)) return configFromEnv(localEnv);
  throw new Error(`The idOS enclave has no configuration for host "${hostname}"`);
}

function configFromEnv(localEnv: LocalEnv): EnclaveConfig {
  if (localEnv.VITE_ENABLE_MPC !== "true") return { allowedEncryptionStores: ["user"] };

  return {
    allowedEncryptionStores: MPC_STORES,
    mpcConfiguration: {
      nodeUrl: localEnv.VITE_MPC_READER_NODE_URL ?? "",
      contractAddress: localEnv.VITE_MPC_CONTRACT_ADDRESS ?? "",
      numMalicious: Number(localEnv.VITE_MPC_NUM_MALICIOUS || 2),
      numNodes: Number(localEnv.VITE_MPC_NUM_NODES || 5),
      numToReconstruct: Number(localEnv.VITE_MPC_NUM_TO_RECONSTRUCT || 3),
    },
  };
}
