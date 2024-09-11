import type { idOSCredential } from "../types";
import type { EnclaveProvider, StoredData } from "./types";

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

  async getSavableAttributes(): Promise<unknown> {
    return this.invokeSnap("getSavableAttributes")
  }
  updateStore(key: string, value: any): Promise<void> {
    return this.invokeSnap("updateStore",{key,value})
  }

  filterCredentialsByCountries(
    credentials: Record<string, string>[],
    countries: string[],
  ): Promise<string[]> {
    console.log(credentials, countries);

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

  invokeSnap(method: string, params: unknown = {}) {
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
    // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
    const encrypted: any = await this.invokeSnap("encrypt", { message, receiverPublicKey });

    return Uint8Array.from(Object.values(encrypted));
  }

  async decrypt(message: Uint8Array, senderPublicKey: Uint8Array): Promise<Uint8Array> {
    const decrypted = await this.invokeSnap("decrypt", { message, senderPublicKey });

    return Uint8Array.from(Object.values(decrypted));
  }
}
