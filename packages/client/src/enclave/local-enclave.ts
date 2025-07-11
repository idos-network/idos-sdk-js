import { base64Encode, type idOSCredential } from "@idos-network/core";

import type {
  DiscoverUserEncryptionPublicKeyResponse,
  EnclaveOptions,
  EnclaveProvider,
  StoredData,
} from "./types";

export class LocalEnclave implements EnclaveProvider {
  options: Omit<EnclaveOptions, "container" | "url" | "localProvider">;
  localProvider: any;

  constructor(options: EnclaveOptions) {
    const { localProvider, ...other } = options;

    this.localProvider = localProvider;
    this.options = other;
  }

  async load(): Promise<void> {
    await this.localProvider.configure(this.options);
  }

  async reconfigure(options: Omit<EnclaveOptions, "container" | "url">): Promise<void> {
    Object.assign(this.options, options);
    await this.localProvider.reconfigure(options);
  }

  async ready(userId: string, expectedUserEncryptionPublicKey?: string): Promise<Uint8Array> {
    let { encryptionPublicKey: userEncryptionPublicKey } =
      (await this.localProvider.getEncryptionPublicKey({
        storage: {
          userId,
          expectedUserEncryptionPublicKey,
        },
      })) as StoredData;

    while (!userEncryptionPublicKey) {
      try {
        userEncryptionPublicKey = (await this.localProvider.getEncryptionPublicKey({
          keys: {},
        })) as Uint8Array;
      } catch (e) {
        if (this.options.throwOnUserCancelUnlock) throw e;
      }
    }

    return userEncryptionPublicKey;
  }

  async reset(): Promise<void> {
    this.localProvider.reset();
  }

  async confirm(message: string): Promise<boolean> {
    return this.localProvider.confirm(message).then((response) => {
      return response as boolean;
    });
  }

  async encrypt(
    message: Uint8Array,
    receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    return this.localProvider.encrypt(message, receiverPublicKey);
  }

  async decrypt(message: Uint8Array, senderPublicKey: Uint8Array): Promise<Uint8Array> {
    return this.localProvider.decrypt(message, senderPublicKey);
  }

  filterCredentials(
    credentials: idOSCredential[],
    privateFieldFilters: { pick: Record<string, unknown[]>; omit: Record<string, unknown[]> },
  ): Promise<idOSCredential[]> {
    return this.localProvider.requestToEnclave({
      filterCredentials: { credentials, privateFieldFilters },
    }) as Promise<idOSCredential[]>;
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
      await this.localProvider.backupPasswordOrSecret();
    } catch (error) {
      console.error(error);
    }
  }

  async discoverUserEncryptionPublicKey(
    userId: string,
  ): Promise<DiscoverUserEncryptionPublicKeyResponse> {
    if (this.options.mode !== "new")
      throw new Error("You can only call `discoverUserEncryptionPublicKey` when mode is `new`.");

    const userEncryptionPublicKey = await this.ready(userId);

    return {
      userId,
      userEncryptionPublicKey: base64Encode(userEncryptionPublicKey),
    };
  }
}
