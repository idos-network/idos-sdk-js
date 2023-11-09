import { IframeEnclave, MetaMaskSnapEnclave } from "./enclave-providers";

export class Enclave {
  constructor(idOS, container, providerType = "iframe") {
    this.idOS = idOS;
    switch (providerType) {
      case "iframe":
        this.provider = new IframeEnclave({ container })
        break;
      case "metamask-snap":
        this.provider = new MetaMaskSnapEnclave();
        break;
      default:
        throw new Error(`Unexpected provider type: ${providerType}`);
    }
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
