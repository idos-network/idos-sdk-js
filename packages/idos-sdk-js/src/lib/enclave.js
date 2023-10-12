import { IframeEnclave } from "./enclave-providers";

export class Enclave {
  constructor(idOS, container) {
    this.idOS = idOS;
    this.provider = new IframeEnclave({ container });
  }

  async loadProvider() {
    const { humanId, signerPublicKey } = await this.provider.load();

    this.idOS.store.set("human-id", humanId);
    this.idOS.store.set("signer-public-key", signerPublicKey);
  }
}
