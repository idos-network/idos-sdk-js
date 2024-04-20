export { IframeEnclave } from "./iframe-enclave";
export { MetaMaskSnapEnclave } from "./metamask-snap-enclave";

import { IframeEnclave } from "./iframe-enclave";
import { MetaMaskSnapEnclave } from "./metamask-snap-enclave";

const ENCLAVE_PROVIDERS = {
  iframe: IframeEnclave,
  "metamask-snap": MetaMaskSnapEnclave
} as const;

export type ProviderType = keyof typeof ENCLAVE_PROVIDERS;
