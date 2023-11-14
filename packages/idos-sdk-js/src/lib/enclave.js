import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { IframeEnclave, MetaMaskSnapEnclave } from "./enclave-providers";

export class Enclave {
  constructor(idOS, container, providerType = "iframe") {
    this.initialized = false;
    this.idOS = idOS;
    switch (providerType) {
      case "iframe":
        this.provider = new IframeEnclave({ container });
        break;
      case "metamask-snap":
        this.provider = new MetaMaskSnapEnclave();
        break;
      default:
        throw new Error(`Unexpected provider type: ${providerType}`);
    }
  }

  async load() {
    const { encryptionPublicKey, humanId, signerAddress, signerPublicKey } = await this.provider.load();

    this.idOS.store.set("encryption-public-key", encryptionPublicKey);
    this.idOS.store.set("human-id", humanId);
    this.idOS.store.set("signer-address", signerAddress);
    this.idOS.store.set("signer-public-key", signerPublicKey);
  }

  async init(humanId) {
    const signerAddress = this.idOS.store.get("signer-address");
    const signerPublicKey = this.idOS.store.get("signer-public-key");

    humanId ||= (await this.idOS.auth.currentUser()).humanId;

    if (!humanId) return;

    this.encryptionPublicKey = await this.provider.init(humanId, signerAddress, signerPublicKey);
    this.idOS.store.set("encryption-public-key", this.publicKey);
    this.initialized = true;

    return this.encryptionPublicKey;
  }

  store(key, value) {
    const transportKey = {
      "human-id": "humanId",
      "signer-address": "signerAddress",
      "signer-public-key": "signerPublicKey",
    }[key];

    return this.provider.store(transportKey, value);
  }

  async encrypt(message, receiverPublicKey) {
    if (!this.initialized) await this.init();

    message = Utf8Codec.encode(message);
    receiverPublicKey &&= Base64Codec.decode(receiverPublicKey);

    return Base64Codec.encode(await this.provider.encrypt(message, receiverPublicKey));
  }

  async decrypt(message, senderPublicKey) {
    if (!this.initialized) await this.init();

    message = Base64Codec.decode(message);
    senderPublicKey &&= Base64Codec.decode(senderPublicKey);

    return Utf8Codec.decode(await this.provider.decrypt(message, senderPublicKey));
  }

  confirm(message) {
    return this.provider.confirm(message);
  }

  reset() {
    return this.provider.reset();
  }
}
