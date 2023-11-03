import { IframeEnclave } from "./enclave-providers";

export class Enclave {
  constructor(idOS, container) {
    this.idOS = idOS;
    this.provider = new IframeEnclave({ container });
  }

  async loadProvider() {
    const { humanId, encryptionPublicKey, signerAddress, signerPublicKey } =
      await this.provider.load();

    this.idOS.store.set("human-id", humanId);
    this.idOS.store.set("encryption-public-key", encryptionPublicKey);
    this.idOS.store.set("signer-address", signerAddress);
    this.idOS.store.set("signer-public-key", signerPublicKey);
  }

  async confirm(message) {
    return this.provider.confirm(message);
  }

  async reset() {
    return await this.provider.reset();
  }
}
