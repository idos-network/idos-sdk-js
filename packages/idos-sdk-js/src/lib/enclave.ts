import {
  type EnclaveProvider,
  base64Decode,
  base64Encode,
  type idOSCredential,
  utf8Decode,
  utf8Encode,
} from "@idos-network/core";
import invariant from "tiny-invariant";

import type { Auth } from "./auth";

export class Enclave {
  userEncryptionPublicKey?: Uint8Array;

  constructor(public readonly enclaveProvider: EnclaveProvider) {}

  async ready(auth: Auth): Promise<Uint8Array> {
    const { userId, currentUserPublicKey } = auth.currentUser;

    if (!userId) throw new Error("Can't operate on a user that has no profile.");

    if (this.userEncryptionPublicKey) return this.userEncryptionPublicKey;

    this.userEncryptionPublicKey = await this.enclaveProvider.ready(userId, currentUserPublicKey);

    return this.userEncryptionPublicKey;
  }

  async encrypt(
    message: string,
    recipientEncryptionPublicKey?: string,
  ): Promise<{ content: string; encryptorPublicKey: string }> {
    invariant(this.userEncryptionPublicKey, "Call enclave.ready first");

    const { content, encryptorPublicKey } = await this.enclaveProvider.encrypt(
      utf8Encode(message),
      recipientEncryptionPublicKey === undefined
        ? undefined
        : base64Decode(recipientEncryptionPublicKey),
    );

    return {
      content: base64Encode(content),
      encryptorPublicKey: base64Encode(encryptorPublicKey),
    };
  }

  async decrypt(message: string, senderEncryptionPublicKey?: string): Promise<string> {
    invariant(this.userEncryptionPublicKey, "Call enclave.ready first");

    return utf8Decode(
      await this.enclaveProvider.decrypt(
        base64Decode(message),
        senderEncryptionPublicKey === undefined
          ? undefined
          : base64Decode(senderEncryptionPublicKey),
      ),
    );
  }

  async filterCredentials(
    credentials: Record<string, string>[],
    privateFieldFilters: {
      pick: Record<string, string>;
      omit: Record<string, string>;
    },
  ): Promise<idOSCredential[]> {
    invariant(this.userEncryptionPublicKey, "Call enclave.ready first");

    return await this.enclaveProvider.filterCredentials(credentials, privateFieldFilters);
  }

  async backupPasswordOrSecret() {
    invariant(this.userEncryptionPublicKey, "Call enclave.ready first");

    return this.enclaveProvider.backupPasswordOrSecret();
  }
}
