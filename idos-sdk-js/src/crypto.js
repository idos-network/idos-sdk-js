import { IframeEnclave } from "./crypto-providers";

export class Crypto {
  constructor(idOS) {
    this.idOS = idOS;
    this.cryptoProvider = new IframeEnclave(); // or new MetaMaskSnap()
  }

  async init() {
    return await this.cryptoProvider.init(await this.idOS.auth.currentUser().humanId);
  }

  async encrypt(message, receiverPublicKey) {
    return await this.cryptoProvider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message) {
    return await this.cryptoProvider.decrypt(message);
  }
}
