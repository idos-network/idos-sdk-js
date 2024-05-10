import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { idOS } from ".";
import { assertNever } from "../types";
import { IframeEnclave, MetaMaskSnapEnclave } from "./enclave-providers";
import { EnclaveProvider } from "./enclave-providers/interface";

const ENCLAVE_PROVIDERS = {
  iframe: IframeEnclave,
  "metamask-snap": MetaMaskSnapEnclave,
} as const;

type ProviderType = keyof typeof ENCLAVE_PROVIDERS;

export class Enclave {
  idOS: idOS;
  provider: EnclaveProvider;
  encryptionPublicKey?: Uint8Array;

  constructor(idOS: idOS, container: string, providerType: ProviderType = "iframe") {
    this.idOS = idOS;

    switch (providerType) {
      case "iframe":
        this.provider = new IframeEnclave({ container });
        break;
      case "metamask-snap":
        this.provider = new MetaMaskSnapEnclave({});
        break;
      default:
        this.provider = assertNever(providerType, `Unexpected provider type: ${providerType}`);
    }
  }

  async load() {
    await this.provider.load();
  }

  async ready(): Promise<Uint8Array> {
    if (this.encryptionPublicKey) return this.encryptionPublicKey;

    const { humanId, address, publicKey } = this.idOS.auth.currentUser;

    if (!humanId) {
      throw new Error("Can't operate on a user that has no profile.");
    }

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
