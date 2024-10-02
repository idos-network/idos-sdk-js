type WalletType = "evm" | "near";

export class Wallet {
  id: string;
  humanId: string;
  address: string;
  walletType: WalletType;
  message: string;
  signature: string;
  nearPublicKey?: string;

  constructor(
    id: string,
    humanId: string,
    address: string,
    walletType: WalletType,
    message: string,
    signature: string,
    nearPublicKey?: string,
  ) {
    this.id = id;
    this.humanId = humanId;
    this.address = address;
    this.nearPublicKey = nearPublicKey;
    this.walletType = walletType;
    this.message = message;
    this.signature = signature;
  }
}
