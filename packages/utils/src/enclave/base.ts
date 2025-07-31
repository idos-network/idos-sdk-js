import type { idOSCredential } from "@idos-network/credentials";
import * as Base64Codec from "@stablelib/base64";
import { negate } from "es-toolkit";
import { every, get } from "es-toolkit/compat";
import { base64Encode, utf8Decode } from "../codecs";
import type { DiscoverUserEncryptionPublicKeyResponse, EnclaveOptions, StoredData } from "./types";

export abstract class BaseProvider<K extends EnclaveOptions = EnclaveOptions> {
  readonly options: K;

  // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
  protected _signMethod?: (domain: any, types: any, value: any) => Promise<string>;

  constructor(options: K) {
    this.options = options;
  }

  setSigner(signer: {
    signTypedData: (domain: string, types: string[], value: string) => Promise<string>;
  }): void {
    this._signMethod = signer.signTypedData.bind(signer);
  }

  // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    if (!this._signMethod) {
      throw new Error("Signer is not set");
    }

    return this._signMethod(domain, types, value);
  }

  async reset(): Promise<void> {
    throw new Error("Reset has to be implemented in the subclass.");
  }

  async reconfigure(options: Partial<K> = {}): Promise<void> {
    Object.assign(this.options, options);
  }

  async load(): Promise<void> {
    // Pass a configuration first
    await this.reconfigure();
  }

  async encrypt(
    _message: Uint8Array,
    _receiverPublicKey?: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    throw new Error("Method 'encrypt' has to be implemented in the subclass.");
  }

  async decrypt(
    _message: Uint8Array,
    _senderPublicKey?: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    throw new Error("Method 'decrypt' has to be implemented in the subclass.");
  }

  async confirm(_message: string): Promise<boolean> {
    throw new Error("Method 'confirm' has to be implemented in the subclass.");
  }

  async storage(_userId: string, _expectedUserEncryptionPublicKey?: string): Promise<StoredData> {
    throw new Error("Method 'storedKeys' has to be implemented in the subclass.");
  }

  async keys(): Promise<Uint8Array | undefined> {
    throw new Error("Method 'keys' has to be implemented in the subclass.");
  }

  async backupPasswordOrSecret(): Promise<void> {
    throw new Error("Method 'backupPasswordOrSecret' has to be implemented in the subclass.");
  }

  /**
   * This method authorizes the origin in case of enclave
   * to use the keys, without user providing the password or MPC again.
   *
   * @returns `true` if the user action is authorized, `false` otherwise.
   */
  async guardKeys(): Promise<boolean> {
    return true;
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

  async filterCredentials(
    credentials: idOSCredential[],
    privateFieldFilters: { pick: Record<string, unknown[]>; omit: Record<string, unknown[]> },
  ): Promise<idOSCredential[]> {
    // biome-ignore lint/suspicious/noExplicitAny: any is fine here
    const matchCriteria = (content: any, criteria: Record<string, unknown[]>) =>
      every(Object.entries(criteria), ([path, targetSet]) =>
        targetSet.includes(get(content, path)),
      );

    const decrypted = await Promise.all(
      credentials.map(async (credential: idOSCredential) => ({
        ...credential,
        content: await this.decrypt(
          Base64Codec.decode(credential.content),
          Base64Codec.decode(credential.encryptor_public_key),
        ),
      })),
    );

    return decrypted
      .map((credential) => ({
        ...credential,
        content: (() => {
          try {
            JSON.parse(utf8Decode(credential.content));
          } catch (_e) {
            throw new Error(`Credential ${credential.id} decrypted contents are not valid JSON`);
          }
        })(),
      }))
      .filter(({ content }) => matchCriteria(content, privateFieldFilters.pick))
      .filter(({ content }) => negate(() => matchCriteria(content, privateFieldFilters.omit)))
      .map((credential) => ({
        ...credential,
        content: "",
      }));
  }

  async ready(userId: string, expectedUserEncryptionPublicKey?: string): Promise<Uint8Array> {
    let { encryptionPublicKey: userEncryptionPublicKey } = await this.storage(
      userId,
      expectedUserEncryptionPublicKey,
    );

    while (!userEncryptionPublicKey) {
      userEncryptionPublicKey = await this.keys();
    }

    return userEncryptionPublicKey as Uint8Array;
  }
}
