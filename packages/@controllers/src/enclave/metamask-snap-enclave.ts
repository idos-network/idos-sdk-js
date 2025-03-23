import type { idOSCredential } from "@idos-network/core";
import type { DiscoverUserEncryptionPublicKeyResponse, EnclaveProvider, StoredData } from "./types";

export class MetaMaskSnapEnclave implements EnclaveProvider {
  // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
  enclaveHost: any;
  snapId: string;

  constructor(_?: Record<string, unknown>) {
    // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
    this.enclaveHost = (window as any).ethereum;
    this.snapId = "npm:@idos-network/metamask-snap-enclave";
  }
  filterCredentials(
    credentials: Record<string, string>[],
    privateFieldFilters: { pick: Record<string, string>; omit: Record<string, string> },
  ): Promise<idOSCredential[]> {
    console.log(credentials, privateFieldFilters);
    throw new Error("Method not implemented.");
  }

  async discoverUserEncryptionPublicKey(): Promise<DiscoverUserEncryptionPublicKeyResponse> {
    throw new Error("Method not implemented.");
  }

  async load(): Promise<StoredData> {
    const snaps = await this.enclaveHost.request({ method: "wallet_getSnaps" });
    // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
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
    userId?: string,
    signerAddress?: string,
    signerPublicKey?: string,
  ): Promise<Uint8Array> {
    let { encryptionPublicKey } = JSON.parse(
      await this.invokeSnap("storage", { userId, signerAddress, signerPublicKey }),
    );

    encryptionPublicKey ||= await this.invokeSnap("init");
    encryptionPublicKey &&= Uint8Array.from(Object.values(encryptionPublicKey));

    return encryptionPublicKey;
  }

  invokeSnap(method: string, params: unknown = {}) {
    return this.enclaveHost.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: this.snapId,
        request: { method, params },
      },
    });
  }

  async reset(): Promise<void> {
    return this.invokeSnap("reset");
  }

  async confirm(message: string): Promise<boolean> {
    return this.invokeSnap("confirm", { message });
  }

  async encrypt(
    message: Uint8Array,
    receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    await this.invokeSnap("encrypt", { message, receiverPublicKey });

    throw new Error("The Metamask Enclave needs to be updated");
  }

  async decrypt(message: Uint8Array, senderPublicKey: Uint8Array): Promise<Uint8Array> {
    const decrypted = await this.invokeSnap("decrypt", { message, senderPublicKey });

    return Uint8Array.from(Object.values(decrypted));
  }

  async backupPasswordOrSecret(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
