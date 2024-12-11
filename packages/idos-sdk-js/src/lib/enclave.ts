import type { idOSCredential } from "@idos-network/idos-sdk-types";
import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import type { Auth } from "./auth";
import type { EnclaveProvider } from "./enclave-providers/types";
import type { BackupPasswordInfo } from "./types";

export class Enclave {
  encryptionPublicKey?: Uint8Array;

  constructor(
    public readonly auth: Auth,
    public readonly provider: EnclaveProvider,
  ) {}

  async load() {
    await this.provider.load();
  }

  async ready(): Promise<Uint8Array> {
    const { humanId, address, publicKey, currentUserPublicKey } = this.auth.currentUser;

    if (!humanId) throw new Error("Can't operate on a user that has no profile.");

    const litAttrs = await this.auth.kwilWrapper.getLitAttrs();
    const userWallets = await this.auth.kwilWrapper.getEvmUserWallets();

    await this.provider.updateStore("litAttrs", litAttrs);
    await this.provider.updateStore("new-user-wallets", userWallets);

    if (this.encryptionPublicKey) return this.encryptionPublicKey;

    this.encryptionPublicKey = await this.provider.ready(
      humanId,
      address,
      publicKey,
      currentUserPublicKey,
    );

    return this.encryptionPublicKey;
  }

  async encrypt(
    message: string,
    receiverPublicKey?: string,
  ): Promise<{ content: string; encryptorPublicKey: string }> {
    if (!this.encryptionPublicKey) await this.ready();

    const { content, encryptorPublicKey } = await this.provider.encrypt(
      Utf8Codec.encode(message),
      receiverPublicKey === undefined ? undefined : Base64Codec.decode(receiverPublicKey),
    );

    return {
      content: Base64Codec.encode(content),
      encryptorPublicKey: Base64Codec.encode(encryptorPublicKey),
    };
  }

  async decrypt(message: string, senderPublicKey?: string): Promise<string> {
    if (!this.encryptionPublicKey) await this.ready();

    return Utf8Codec.decode(
      await this.provider.decrypt(
        Base64Codec.decode(message),
        senderPublicKey === undefined ? undefined : Base64Codec.decode(senderPublicKey),
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
    if (!this.encryptionPublicKey) await this.ready();
    return await this.provider.filterCredentialsByCountries(credentials, countries);
  }

  async filterCredentials(
    credentials: Record<string, string>[],
    privateFieldFilters: {
      pick: Record<string, string>;
      omit: Record<string, string>;
    },
  ): Promise<idOSCredential[]> {
    if (!this.encryptionPublicKey) await this.ready();
    return await this.provider.filterCredentials(credentials, privateFieldFilters);
  }

  async backupPasswordOrSecret(callbackFn: (response: BackupPasswordInfo) => Promise<void>) {
    await this.ready();

    return this.provider.backupPasswordOrSecret(callbackFn);
  }

  async discoverUserEncryptionKey(humanId: string) {
    return this.provider.discoverUserEncryptionKey(humanId);
  }
}
