import { IframeEnclave } from "./crypto-providers";
//import { MetaMaskSnap } from "./crypto-providers";

class Nonce {
  constructor(length=32) {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(length)));
  }
}

export class Crypto {
  Nonce = Nonce;

  constructor(idOS) {
    this.idOS = idOS;
    this.provider = new IframeEnclave({ container: this.idOS.container });
  }

  async loadProvider() {
    const { humanId, signerPublicKey } = await this.provider.load();

    this.humanId = humanId;
    this.signerPublicKey = signerPublicKey;
  }

  async init() {
    this.humanId = this.humanId || (await this.idOS.auth.currentUser()).humanId;

    this.keys = await this.provider.init(this.humanId, this.signerPublicKey);

    return this.keys.encryption;
  }

  async sign(message) {
    return await this.provider.sign(message);
  }

  async verifySig(message, signature, signerPublicKey) {
    return await this.provider.verifySig(message, signature, signerPublicKey);
  }

  async encrypt(message, receiverPublicKey) {
    return await this.provider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message, public_key) {
    return await this.provider.decrypt(message, public_key);
  }
}
