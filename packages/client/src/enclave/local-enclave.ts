import { decrypt, encrypt } from "@idos-network/utils/encryption";
import { LocalStorageStore, type Store } from "@idos-network/utils/store";
import * as Base64Codec from "@stablelib/base64";
import { BaseProvider } from "./base";
import type { EnclaveOptions, StoredData } from "./types";

export interface LocalEnclaveOptions extends EnclaveOptions {
  store?: Store;
}

export class LocalEnclave extends BaseProvider<LocalEnclaveOptions> {
  protected keyPair: nacl.BoxKeyPair | null = null;

  // This is used in the derived class to check if the user password is correct
  protected userId?: string;
  protected expectedUserEncryptionPublicKey?: string;

  protected store: Store;
  protected storeWithCodec: Store;

  constructor(options: LocalEnclaveOptions) {
    super(options);

    this.store = options.store ?? new LocalStorageStore();
    this.storeWithCodec = this.store.pipeCodec<Uint8Array<ArrayBufferLike>>(Base64Codec);
  }

  async reset(): Promise<void> {
    this.store.reset();
  }

  async storage(userId: string, expectedUserEncryptionPublicKey?: string): Promise<StoredData> {
    const storedUserId = await this.store.get<string>("user-id");
    const storedEncryptionPublicKey =
      await this.storeWithCodec.get<Uint8Array<ArrayBufferLike>>("encryption-public-key");

    if (storedUserId !== userId) await this.store.reset();

    userId && (await this.store.set("user-id", userId));

    // This will be used later in ready method
    this.userId = userId;
    this.expectedUserEncryptionPublicKey = expectedUserEncryptionPublicKey;

    if (userId !== storedUserId) {
      return { userId: "" };
    }

    return {
      userId: storedUserId,
      encryptionPublicKey: storedEncryptionPublicKey,
    };
  }

  // Keys & confirm method needs to be implemented

  async encrypt(
    message: Uint8Array,
    receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    if (!this.keyPair) await this.keys();

    if (!this.keyPair) throw new Error("Key pair not initialized");

    return encrypt(message, this.keyPair.publicKey, receiverPublicKey);
  }

  async decrypt(
    message: Uint8Array,
    senderPublicKey: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    if (!this.keyPair) await this.keys();

    if (!this.keyPair) throw new Error("Key pair not initialized");

    return decrypt(message, this.keyPair, senderPublicKey);
  }

  async backupPasswordOrSecret(): Promise<void> {
    const abortController = new AbortController();

    window.addEventListener(
      "message",
      async (event) => {
        if (event.data.type !== "idOS:store") return;

        let status = "";

        try {
          status = "success";
        } catch (_) {
          status = "failure";
        }

        event.ports[0].postMessage({
          result: {
            type: "idOS:store",
            status,
          },
        });
        event.ports[0].close();
        abortController.abort();
      },
      { signal: abortController.signal },
    );

    try {
      await this.backupPasswordOrSecret();
    } catch (error) {
      console.error(error);
    }
  }
}
