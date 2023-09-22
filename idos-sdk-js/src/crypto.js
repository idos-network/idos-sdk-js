import { IframeEnclave } from "./crypto-providers";

export class Crypto {
  constructor(idOS, options) {
    this.idOS = idOS;
    this.cryptoProvider = new IframeEnclave({ // or new MetaMaskSnap()
      container: this.idOS.container || "body",
    });
  }

  async init() {
    //return await this.cryptoProvider.init(await this.idOS.auth.currentUser().humanId);
    // TODO
    // fix this catch 22:
    //   * we need the humanId for cryptoProvider.init
    //   * we need the keys to run auth.currentUser()
    // (because salting happens within the enclave)
    this.publicKeys = await this.cryptoProvider.init("9a489a2e-820c-4e46-b717-a0e3740fa001");
  }

  async sign(message) {
    return await this.cryptoProvider.sign(message);
  }

  verifySig(message, signature, signerPublicKey) {
    return this.cryptoProvider.verifySig(message, signature, signerPublicKey);
  }

  async encrypt(message, receiverPublicKey) {
    return await this.cryptoProvider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message) {
    return await this.cryptoProvider.decrypt(message);
  }
}
