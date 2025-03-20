import {
  base64Decode,
  base64Encode,
  type idOSCredential,
  utf8Decode,
  utf8Encode,
} from "@idos-network/core";

import type { Auth } from "./auth";
import type { EnclaveProvider } from "./enclave-providers/types";

export class Enclave {
  userEncryptionPublicKey?: Uint8Array;

  constructor(
    public readonly auth: Auth,
    public readonly provider: EnclaveProvider,
  ) {}

  async load() {
    await this.provider.load();
  }

  async ready(): Promise<Uint8Array> {
    const { userId, userAddress, nearWalletPublicKey, currentUserPublicKey } =
      this.auth.currentUser;

    if (!userId) throw new Error("Can't operate on a user that has no profile.");

    if (this.userEncryptionPublicKey) return this.userEncryptionPublicKey;

    this.userEncryptionPublicKey = await this.provider.ready(
      userId,
      userAddress,
      nearWalletPublicKey,
      currentUserPublicKey,
    );

    return this.userEncryptionPublicKey;
  }

  async encrypt(
    message: string,
    recipientEncryptionPublicKey?: string,
  ): Promise<{ content: string; encryptorPublicKey: string }> {
    if (!this.userEncryptionPublicKey) await this.ready();

    const { content, encryptorPublicKey } = await this.provider.encrypt(
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
    if (!this.userEncryptionPublicKey) await this.ready();

    return utf8Decode(
      await this.provider.decrypt(
        base64Decode(message),
        senderEncryptionPublicKey === undefined
          ? undefined
          : base64Decode(senderEncryptionPublicKey),
      ),
    );
  }

  async confirm(message: string) {
    return this.provider.confirm(message);
  }

  async reset() {
    return this.provider.reset();
  }

  async updateStore(key: string, value: unknown) {
    this.provider.updateStore(key, value);
  }

  async filterCredentialsByCountries(credentials: Record<string, string>[], countries: string[]) {
    if (!this.userEncryptionPublicKey) await this.ready();
    return await this.provider.filterCredentialsByCountries(credentials, countries);
  }

  async filterCredentials(
    credentials: Record<string, string>[],
    privateFieldFilters: {
      pick: Record<string, string>;
      omit: Record<string, string>;
    },
  ): Promise<idOSCredential[]> {
    if (!this.userEncryptionPublicKey) await this.ready();
    return await this.provider.filterCredentials(credentials, privateFieldFilters);
  }

  async backupPasswordOrSecret() {
    await this.ready();

    return this.provider.backupPasswordOrSecret();
  }

  async discoverUserEncryptionPublicKey(userId: string) {
    return this.provider.discoverUserEncryptionPublicKey(userId);
  }
}
