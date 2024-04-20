import * as Base64Codec from "@stablelib/base64";
import * as Utf8Codec from "@stablelib/utf8";
import type { EnclaveProvider } from "./enclave-providers/interface";
import { Store } from "../../../idos-store";

export class Enclave {
  idOSStore: Store;
  initialized: boolean;
  provider: EnclaveProvider;
  encryptionPublicKey?: Uint8Array;
  humanIdDiscoverer: () => Promise<string | undefined>;

  constructor(
    store: Store,
    provider: EnclaveProvider,
    humanIdDiscoverer: () => Promise<string | undefined>
  ) {
    this.idOSStore = store;
    this.initialized = false;
    this.provider = provider;
    this.humanIdDiscoverer = humanIdDiscoverer;
  }

  async load() {
    const { encryptionPublicKey, humanId, signerAddress, signerPublicKey } =
      await this.provider.load();

    if (encryptionPublicKey) {
      if (encryptionPublicKey.length !== 32) throw new Error("Invalid `encryptionPublicKey`");

      const key = Base64Codec.encode(encryptionPublicKey as any);

      if (key.length !== 44) throw new Error("Invalid serialised `encryptionPublicKey` length");

      this.idOSStore.set("encryption-public-key", key);
    }

    this.idOSStore.set("human-id", humanId);
    this.idOSStore.set("signer-address", signerAddress);
    this.idOSStore.set("signer-public-key", signerPublicKey);
  }

  async init(): Promise<Uint8Array> {
    const signerAddress = this.idOSStore.get("signer-address");
    const signerPublicKey = this.idOSStore.get("signer-public-key");

    const humanId = await this.humanIdDiscoverer();

    if (!humanId) throw new Error("Could not initialize user.");

    this.encryptionPublicKey = await this.provider.init(
      humanId,
      signerAddress,
      signerPublicKey,
      undefined
    );
    this.idOSStore.set("encryption-public-key", Base64Codec.encode(this.encryptionPublicKey));
    this.initialized = true;

    return this.encryptionPublicKey;
  }

  store(key: string, value: any) {
    const transportKey = {
      "human-id": "humanId",
      "signer-address": "signerAddress",
      "signer-public-key": "signerPublicKey"
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
