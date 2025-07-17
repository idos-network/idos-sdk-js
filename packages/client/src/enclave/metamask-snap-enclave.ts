import { BaseProvider } from "./base";
import type { EnclaveOptions, StoredData } from "./types";

export class MetaMaskSnapEnclave extends BaseProvider<EnclaveOptions> {
  // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
  private enclaveHost: any;
  private snapId: string;

  constructor(options: EnclaveOptions) {
    super(options);

    // biome-ignore lint/suspicious/noExplicitAny: Types will be added later.
    this.enclaveHost = (window as any).ethereum;
    this.snapId = "npm:@idos-network/metamask-snap-enclave";
  }

  async load(): Promise<void> {
    await super.load();

    const snaps = await this.enclaveHost.request({ method: "wallet_getSnaps" });
    // biome-ignore lint/suspicious/noExplicitAny: Types will be added later
    const connected = Object.values(snaps).find((snap: any) => snap.id === this.snapId);

    if (!connected)
      await this.enclaveHost.request({
        method: "wallet_requestSnaps",
        params: { [this.snapId]: {} },
      });
  }

  async storage(userId: string, _expectedUserEncryptionPublicKey?: string): Promise<StoredData> {
    let { encryptionPublicKey } = JSON.parse(await this.invokeSnap("storage", { userId }));

    encryptionPublicKey ||= await this.invokeSnap("init");
    encryptionPublicKey &&= Uint8Array.from(Object.values(encryptionPublicKey));

    return {
      encryptionPublicKey,
      userId,
    };
  }

  // biome-ignore lint/suspicious/noExplicitAny: Using `any` to avoid type errors.
  private invokeSnap(method: string, params: unknown = {}): Promise<any> {
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

  async decrypt(
    message: Uint8Array,
    senderPublicKey: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    const decrypted = await this.invokeSnap("decrypt", { message, senderPublicKey });

    return Uint8Array.from(Object.values(decrypted));
  }

  async backupPasswordOrSecret(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
