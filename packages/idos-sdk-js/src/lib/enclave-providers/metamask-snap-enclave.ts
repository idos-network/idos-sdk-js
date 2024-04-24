import { EnclaveProvider, StoredData } from "./interface";

export class MetaMaskSnapEnclave implements EnclaveProvider {
  enclaveHost: any;
  snapId: string;

  constructor(_?: {}) {
    this.enclaveHost = (window as any).ethereum;
    this.snapId = "npm:@idos-network/metamask-snap-enclave";
  }

  async load(): Promise<StoredData> {
    const snaps = await this.enclaveHost.request({ method: "wallet_getSnaps" });
    const connected = Object.values(snaps).find((snap: any) => snap.id === this.snapId);

    if (!connected)
      await this.enclaveHost.request({
        method: "wallet_requestSnaps",
        params: { [this.snapId]: {} },
      });

    const storage = JSON.parse((await this.invokeSnap("storage")) || {});
    storage.encryptionPublicKey &&= Uint8Array.from(Object.values(storage.encryptionPublicKey));

    return storage;
  }

  async ready(
    humanId?: string,
    signerAddress?: string,
    signerPublicKey?: string,
  ): Promise<Uint8Array> {
    let { encryptionPublicKey } = JSON.parse(
      await this.invokeSnap("storage", { humanId, signerAddress, signerPublicKey }),
    );

    encryptionPublicKey ||= await this.invokeSnap("init");
    encryptionPublicKey &&= Uint8Array.from(Object.values(encryptionPublicKey));

    return encryptionPublicKey;
  }

  invokeSnap(method: string, params: any = {}) {
    return this.enclaveHost.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: this.snapId,
        request: { method, params },
      },
    });
  }

  async store(key: string, value: string): Promise<string> {
    return this.invokeSnap("storage", { [key]: value });
  }

  async reset(): Promise<void> {
    return this.invokeSnap("reset");
  }

  async confirm(message: string): Promise<boolean> {
    return this.invokeSnap("confirm", { message });
  }

  async encrypt(message: Uint8Array, receiverPublicKey: Uint8Array): Promise<Uint8Array> {
    const encrypted: any = await this.invokeSnap("encrypt", { message, receiverPublicKey });

    return Uint8Array.from(Object.values(encrypted));
  }

  async decrypt(message: Uint8Array, senderPublicKey: Uint8Array): Promise<Uint8Array> {
    const decrypted = await this.invokeSnap("decrypt", { message, senderPublicKey });

    return Uint8Array.from(Object.values(decrypted));
  }
}
