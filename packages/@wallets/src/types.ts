export type SupportedWallets = "eth" | "near" | "xrp" | "stellar";

export interface Wallet {
  /* Random ID for the wallet */
  id: string;

  /* Name of the wallet */
  name: string;

  /* Address of the wallet */
  address: string;

  /* Public key of the wallet */
  publicKey: string;

  /* Chain ID */
  chainId: number;

  /* Sign message */
  signMessage: (message: string) => Promise<string>;
}
