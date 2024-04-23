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
  readied: boolean;
  provider: EnclaveProvider;
  encryptionPublicKey?: Uint8Array;

  constructor(idOS: idOS, container: string, providerType: ProviderType = "iframe") {
    this.readied = false;
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
    const { encryptionPublicKey, humanId, signerAddress, signerPublicKey } =
      await this.provider.load();

    if (encryptionPublicKey) {
      if (encryptionPublicKey.length !== 32) throw new Error("Invalid `encryptionPublicKey`");

      const key = Base64Codec.encode(encryptionPublicKey as any);

      if (key.length !== 44) throw new Error("Invalid serialised `encryptionPublicKey` length");

      this.idOS.store.set("encryption-public-key", key);
    }

    this.idOS.store.set("human-id", humanId);
    this.idOS.store.set("signer-address", signerAddress);
    this.idOS.store.set("signer-public-key", signerPublicKey);
  }

  async ready(humanId?: string, authMethod?: boolean): Promise<Uint8Array> {
    const signerAddress = this.idOS.store.get("signer-address");
    const signerPublicKey = this.idOS.store.get("signer-public-key");

    humanId ||= (await this.idOS.auth.currentUser()).humanId;

    if (!humanId) throw new Error("Could not initialize user.");

    this.encryptionPublicKey = await this.provider.ready(
      humanId,
      signerAddress,
      signerPublicKey,
      authMethod
    );
    this.idOS.store.set("encryption-public-key", Base64Codec.encode(this.encryptionPublicKey));
    this.readied = true;

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
    if (!this.readied) await this.ready();

    return Base64Codec.encode(
      await this.provider.encrypt(
        Utf8Codec.encode(message),
        receiverPublicKey === undefined ? undefined : Base64Codec.decode(receiverPublicKey)
      )
    );
  }

  async decrypt(message: string, senderPublicKey?: string): Promise<string> {
    if (!this.readied) await this.ready();

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
