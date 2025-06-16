export type SupportedWallets = "eth" | "near" | "xrp" | "stellar";

export class Wallet {
  /* Random ID for the wallet */
  id: string;

  /* Chain of the wallet */
  chain: SupportedWallets;

  /* Adapter of the wallet */
  adapter: string;

  /* Address of the wallet */
  address: string;

  /* Public key of the wallet */
  publicKey: string;

  /* Network ID */
  networkId: number;

  /* Sign message */
  signMessageInternal: (message: string) => Promise<string>;

  constructor(chain: SupportedWallets, adapter: string, address: string, publicKey: string, networkId: number, signMessage: (message: string) => Promise<string>) {
    this.id = crypto.randomUUID();
    this.chain = chain;
    this.adapter = adapter;
    this.address = address;
    this.publicKey = publicKey;
    this.networkId = networkId;
    this.signMessageInternal = signMessage;
  }

  async signMessage(message: string): Promise<string> {
    return await this.signMessageInternal(message);
  }
}

export interface ChainProvider {
  addWallets: (wallets: Wallet[]) => void;
}
