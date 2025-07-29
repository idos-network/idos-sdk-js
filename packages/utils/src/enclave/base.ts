import type { idOSCredential } from "@idos-network/credentials";
import * as Base64Codec from "@stablelib/base64";
import { negate } from "es-toolkit";
import { every, get } from "es-toolkit/compat";
import { fromBytesToJson } from "../codecs";
import type { EnclaveOptions, PublicEncryptionProfile } from "./types";

export abstract class BaseProvider<K extends EnclaveOptions = EnclaveOptions> {
  readonly options: K;

  // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
  protected _signMethod?: (domain: any, types: any, value: any) => Promise<string>;

  constructor(options: K) {
    this.options = options;
  }

  /**
   * Sets the signer for the enclave.
   *
   * @param signer - The signer to set, is later used for MPC if allowed.
   */
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

  /**
   * Helper method to get the user ID.
   *
   * @returns The user ID.
   */
  get userId(): string {
    if (!this.options.userId) {
      throw new Error("User ID is not present");
    }
    return this.options.userId;
  }

  /**
   * Resets the enclave (storage etc.)
   */
  async reset(): Promise<void> {
    // Implement this if needed in child classes
  }

  /**
   * Reconfigures the enclave (theme etc).
   *
   * @param options - The options to reconfigure.
   */
  async reconfigure(options: Partial<K> = {}): Promise<void> {
    Object.assign(this.options, options);
  }

  /**
   * Loads the enclave (create iframe, open connection, etc.)
   */
  async load(): Promise<void> {
    await this.reconfigure();
  }

  /**
   * Encrypts a message to a receiver.
   * This method also checks if the user is authorized to use the keys.
   *
   * @param _message - The message to encrypt.
   * @param _receiverPublicKey - The public key of the receiver.
   *
   * @returns The encrypted message.
   */
  async encrypt(
    _message: Uint8Array,
    _receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    throw new Error("Method 'encrypt' has to be implemented in the subclass.");
  }

  /**
   * Decrypts a message from a sender.
   * This method also checks if the user is authorized to use the keys.
   *
   * @param _message - The message to decrypt.
   * @param _senderPublicKey - The public key of the sender.
   *
   * @returns The decrypted message.
   */
  async decrypt(
    _message: Uint8Array,
    _senderPublicKey: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    throw new Error("Method 'decrypt' has to be implemented in the subclass.");
  }

  /**
   * This method is used to confirm the user action.
   *
   * @param _message - The message to confirm.
   *
   * @returns `true` if the user action is confirmed, `false` otherwise.
   */
  async confirm(_message: string): Promise<boolean> {
    throw new Error("Method 'confirm' has to be implemented in the subclass.");
  }

  /**
   * This method is used to backup the password context.
   */
  async backupUserEncryptionProfile(): Promise<void> {
    throw new Error("Method 'backupUserEncryptionProfile' has to be implemented in the subclass.");
  }

  /**
   * Gets the public encryption profile.
   *
   * @returns The public encryption profile.
   */
  async getPublicEncryptionProfile(): Promise<PublicEncryptionProfile> {
    throw new Error("Method 'getPublicEncryptionProfile' has to be implemented in the subclass.");
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

  /**
   * Filters the credentials based on the private field filters.
   *
   * @param credentials - The credentials to filter.
   * @param privateFieldFilters - The private field filters.
   *
   * @returns The filtered credentials without the content.
   */
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
            fromBytesToJson(credential.content);
          } catch (_e) {
            throw new Error(`Credential ${credential.id} decrypted contents are not valid JSON`);
          }
        })(),
      }))
      .filter(({ content }) => matchCriteria(content, privateFieldFilters.pick))
      .filter(({ content }) => negate(() => matchCriteria(content, privateFieldFilters.omit)))
      .map((credential) => ({
        ...credential,
        content: "", // Content should not leave the enclave
      }));
  }
}
