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

  async init() {
    let humanId;

    try {
      humanId = (await this.idOS.auth.currentUser()).humanId;
    } catch (e) {
      humanId = "unknown";
    }

    this.publicKeys = await this.provider.init(humanId);

    return this.publicKeys.encryption;
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

  async decrypt(message) {
    return await this.provider.decrypt(message);
  }
}
