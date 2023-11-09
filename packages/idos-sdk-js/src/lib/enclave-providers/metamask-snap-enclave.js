import { EnclaveProvider } from "./enclave-provider";
import * as Base64Codec from "@stablelib/base64";

export class MetaMaskSnapEnclave extends EnclaveProvider {

  constructor(options) {
    super(options);
    this.enclaveHost = window.ethereum;
    this.snapId = "npm:@idos-network/metamask-snap-enclave";
  }

  async load() {
    const snaps = await this.enclaveHost.request({ method: "wallet_getSnaps" });
    const connected = Object.values(snaps).find(snap => snap.id === this.snapId);

    if (!connected) await this.enclaveHost.request({
      method: "wallet_requestSnaps",
      params: { [this.snapId]: {} },
    });

    const storage = JSON.parse(await this.invokeSnap("storage") || {});
    storage.encryptionPublicKey &&= Base64Codec.encode(Uint8Array.from(Object.values(storage.encryptionPublicKey)));

    return storage;
  }

  async init(humanId, signerAddress, signerPublicKey) {
    let { encryptionPublicKey } = JSON.parse(
      await this.invokeSnap("storage", { humanId, signerAddress, signerPublicKey }),
    );

    encryptionPublicKey ||= await this.invokeSnap("init");
    encryptionPublicKey &&= Base64Codec.encode(Uint8Array.from(Object.values(encryptionPublicKey)));

    return encryptionPublicKey;
  }

  async invokeSnap (method, params = {}) {
    return this.enclaveHost.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: this.snapId,
        request: { method, params },
      }
    });
  }

  async reset() {
    return await this.invokeSnap("reset");
  }

  async confirm(message) {
    return await this.invokeSnap("confirm", { message });
  }

  async encrypt(message, receiverPublicKey) {
    const encrypted = await this.invokeSnap("encrypt", { message, receiverPublicKey });

    return Uint8Array.from(Object.values(decrypted));
  }

  async decrypt(message, senderPublicKey) {
    const decrypted = await this.invokeSnap("decrypt", { message, senderPublicKey });
    return Uint8Array.from(Object.values(decrypted));
  }
}
