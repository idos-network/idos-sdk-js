import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import { assertNever } from "../types";
import { IframeEnclave, MetaMaskSnapEnclave } from "./enclave-providers";
import { EnclaveProvider } from "./enclave-providers/enclave-provider";

type idOS = any; // TODO Replace this when it's typed.

const ENCLAVE_PROVIDERS = {
  iframe: IframeEnclave,
  "metamask-snap": MetaMaskSnapEnclave,
} as const;

type ProviderType = keyof typeof ENCLAVE_PROVIDERS;

export class Enclave {
  idOS: idOS;
  initialized: boolean;
  provider: EnclaveProvider;
  encryptionPublicKey?: Uint8Array;

  constructor(idOS: idOS, container: string, providerType: ProviderType = "iframe") {
    this.initialized = false;
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
    const { encryptionPublicKey, humanId, signerAddress, signerPublicKey } = await this.provider.load();

    this.idOS.store.set("encryption-public-key", encryptionPublicKey);
    this.idOS.store.set("human-id", humanId);
    this.idOS.store.set("signer-address", signerAddress);
    this.idOS.store.set("signer-public-key", signerPublicKey);
  }

  async init(humanId?: string): Promise<Uint8Array | undefined> {
    const signerAddress = this.idOS.store.get("signer-address");
    const signerPublicKey = this.idOS.store.get("signer-public-key");

    humanId ||= (await this.idOS.auth.currentUser()).humanId;

    if (!humanId) return undefined;

    this.encryptionPublicKey = await this.provider.init(humanId, signerAddress, signerPublicKey);
    this.idOS.store.set("encryption-public-key", this.encryptionPublicKey);
    this.initialized = true;

    return this.encryptionPublicKey;
  }

  store(key: string, value: any) {
    const transportKey = {
      "human-id": "humanId",
      "signer-address": "signerAddress",
      "signer-public-key": "signerPublicKey",
    }[key]!;

    return this.provider.store(transportKey, value);
  }

  async encrypt(message: string, receiverPublicKey?: string): Promise<string> {
    if (!this.initialized) await this.init();

    return Base64Codec.encode(
      await this.provider.encrypt(
        Utf8Codec.encode(message),
        receiverPublicKey === undefined ? undefined : Base64Codec.decode(receiverPublicKey)
      )
    );
  }

  async decrypt(message: string, senderPublicKey?: string): Promise<string> {
    if (!this.initialized) await this.init();

    return Utf8Codec.decode(
      await this.provider.decrypt(
        Base64Codec.decode(message),
        senderPublicKey === undefined ? undefined : Base64Codec.decode(senderPublicKey)
      )
    );
  }

  async confirm(message: string) {
    return this.provider.confirm(message);
  }

  async reset() {
    return this.provider.reset();
  }
}
