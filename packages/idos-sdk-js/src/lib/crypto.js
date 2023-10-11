import { IframeEnclave } from "./crypto-providers";
//import { MetaMaskSnap } from "./crypto-providers";

export class Crypto {
  constructor(idOS) {
    this.idOS = idOS;
    this.provider = new IframeEnclave({ container: this.idOS.container });
  }

  async init() {
    //return await this.provider.init(await this.idOS.auth.currentUser().humanId);
    // TODO
    // fix this catch 22:
    //   * we need the humanId for provider.init
    //   * we need the keys to run auth.currentUser()
    // (because salting happens within the enclave)
    this.publicKeys = await this.provider.init((await this.idOS.auth.currentUser()).humanId);

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

  async decrypt(message, public_key) {
    return await this.provider.decrypt(message, public_key);
  }
}
