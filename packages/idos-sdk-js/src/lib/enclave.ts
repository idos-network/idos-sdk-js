import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import type { Auth } from "./auth";
import type { EnclaveProvider } from "./enclave-providers/types";

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
    if (this.encryptionPublicKey) return this.encryptionPublicKey;

    const { humanId, address, publicKey } = this.auth.currentUser;

    if (!humanId) throw new Error("Can't operate on a user that has no profile.");

    this.encryptionPublicKey = await this.provider.ready(humanId, address, publicKey);

    return this.encryptionPublicKey;
  }

  async encrypt(message: string, receiverPublicKey?: string): Promise<string> {
    if (!this.encryptionPublicKey) await this.ready();

    return Base64Codec.encode(
      await this.provider.encrypt(
        Utf8Codec.encode(message),
        receiverPublicKey === undefined ? undefined : Base64Codec.decode(receiverPublicKey),
      ),
    );
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
}
