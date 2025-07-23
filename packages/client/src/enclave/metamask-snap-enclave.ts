import type { idOSCredential } from "@idos-network/credentials";
import type {
  DiscoverUserEncryptionPublicKeyResponse,
  EnclaveOptions,
  EnclaveProvider,
} from "./types";

export class MetaMaskSnapEnclave implements EnclaveProvider {
  // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
  enclaveHost: any;
  snapId: string;

  constructor(_?: Record<string, unknown>) {
    // biome-ignore lint/suspicious/noExplicitAny: Types will be added later.
    this.enclaveHost = (window as any).ethereum;
    this.snapId = "npm:@idos-network/metamask-snap-enclave";
  }
  reconfigure(_options: Omit<EnclaveOptions, "container" | "url">): Promise<void> {
    throw new Error("Method not implemented.");
  }
  filterCredentials(
    credentials: idOSCredential[],
    privateFieldFilters: { pick: Record<string, unknown[]>; omit: Record<string, unknown[]> },
  ): Promise<idOSCredential[]> {
    console.log(credentials, privateFieldFilters);
    throw new Error("Method not implemented.");
  }

  async discoverUserEncryptionPublicKey(): Promise<DiscoverUserEncryptionPublicKeyResponse> {
    throw new Error("Method not implemented.");
  }

  async load(): Promise<void> {
    const snaps = await this.enclaveHost.request({ method: "wallet_getSnaps" });
    // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
    const connected = Object.values(snaps).find((snap: any) => snap.id === this.snapId);

    if (!connected)
      await this.enclaveHost.request({
        method: "wallet_requestSnaps",
        params: { [this.snapId]: {} },
      });
  }

  async ready(userId: string): Promise<Uint8Array> {
    let { encryptionPublicKey } = JSON.parse(await this.invokeSnap("storage", { userId }));

    encryptionPublicKey ||= await this.invokeSnap("init");
    encryptionPublicKey &&= Uint8Array.from(Object.values(encryptionPublicKey));

    return encryptionPublicKey;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Using `any` to avoid type errors.
  invokeSnap(method: string, params: unknown = {}): Promise<any> {
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
