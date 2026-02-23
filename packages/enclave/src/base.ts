import type { idOSCredential } from "@idos-network/credentials/types";
import { recordFilter } from "@idos-network/credentials/utils";
import { base64Decode, fromBytesToJson, hexEncode } from "@idos-network/utils/codecs";
import type {
  AddAddressMessageToSign,
  AddAddressSignatureMessage,
  RemoveAddressMessageToSign,
  RemoveAddressSignatureMessage,
} from "./mpc/types";
import type { EnclaveOptions, PublicEncryptionProfile } from "./types";

export abstract class BaseProvider<K extends EnclaveOptions = EnclaveOptions> {
  readonly options: K;

  // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
  protected _signMethod?: (domain: any, types: any, value: any) => Promise<string>;
  private _signMethodType?: "signTypedData" | "signMessage" | "signer";

  constructor(options: K) {
    this.options = options;
  }

  /**
   * Sets the signer for the enclave.
   *
   * @param signer - The signer to set, is later used for MPC if allowed.
   */
  setSigner(signer: {
    signTypedData?: (domain: string, types: string[], value: string) => Promise<string>;
    // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
    signMessage?: (message: string) => Promise<any>;
    // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
    signer?: (message: string) => Promise<any>;
  }): void {
    if (signer.signTypedData) {
      // EVM wallet
      this._signMethod = signer.signTypedData.bind(signer);
      this._signMethodType = "signTypedData";
    } else if (signer.signMessage) {
      // XRPL wallet
      this._signMethod = signer.signMessage.bind(signer);
      this._signMethodType = "signMessage";
    } else if (signer.signer) {
      // Stellar wallet
      this._signMethod = signer.signer.bind(signer);
      this._signMethodType = "signer";
    } else {
      if (["signMessage", "signer"].some((key) => key in signer)) {
        this._signMethod = signer.signMessage
          ? // @ts-expect-error - signMessage for xrpl and near, signer for stellar
            signer.signMessage.bind(signer)
          : // @ts-expect-error - signMessage for xrpl and near, signer for stellar
            signer.signer?.bind(signer);
      } else {
        throw new Error("No sign method found in passed signer");
      }
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    if (!this._signMethod || !this._signMethodType) {
      throw new Error("Signer is not set");
    }

    let signature: string;

    // Handle different signing methods based on wallet type
    if (this._signMethodType === "signTypedData") {
      // EVM wallets: use all 3 arguments
      signature =
        await // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
        (this._signMethod as (domain: any, types: any, value: any) => Promise<string>)(
          domain,
          types,
          value,
        );
    } else if (this._signMethodType === "signMessage" || this._signMethodType === "signer") {
      // XRPL/NEAR/Stellar/FaceSign wallets: use only the value as message
      const messageString = JSON.stringify(value);
      // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
      const response = await (this._signMethod as (message: any) => Promise<any>)(messageString);

      // Extract signature from response object
      if (typeof response === "string") {
        signature = response;
      } else if (response?.result?.signedMessage) {
        signature = response.result.signedMessage;
      } else if (response?.signedMessage) {
        signature = response.signedMessage;
      } else if (response instanceof Uint8Array && response.length === 64) {
        // ed25519 signature size
        return hexEncode(response);
      } else {
        throw new Error(
          `Unexpected response format from ${this._signMethodType}: ${JSON.stringify(response)}`,
        );
      }
    } else {
      throw new Error(`Unknown sign method type: ${this._signMethodType}`);
    }

    return signature;
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
  async ensureUserEncryptionProfile(): Promise<PublicEncryptionProfile> {
    throw new Error("Method 'ensureUserEncryptionProfile' has to be implemented in the subclass.");
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
    if (
      Object.keys(privateFieldFilters.pick).length === 0 &&
      Object.keys(privateFieldFilters.omit).length === 0
    ) {
      // No filtering needed
      return credentials.map((credential) => ({
        ...credential,
        content: "", // Content should never leave the enclave!!!
      }));
    }

    // We need to be sure first that we have the encryption profile
    // otherwise we can end up with a lot of signatures for each credential
    await this.ensureUserEncryptionProfile();

    const decrypted = await Promise.all(
      credentials.map(async (credential: idOSCredential) => {
        const content = await this.decrypt(
          base64Decode(credential.content),
          base64Decode(credential.encryptor_public_key),
        );

        let json: Record<string, unknown>;

        try {
          json = fromBytesToJson(content);
        } catch (_e) {
          throw new Error(`Credential ${credential.id} decrypted contents are not valid JSON`);
        }

        return {
          ...credential,
          content: json,
        };
      }),
    );

    return decrypted
      .filter(({ content }) =>
        recordFilter(
          content as Record<string, unknown>,
          privateFieldFilters.pick,
          privateFieldFilters.omit,
        ),
      )
      .map((credential) => ({
        ...credential,
        content: "", // Content should never leave the enclave!!!
      }));
  }

  async addAddressMessageToSign(
    _address: string,
    _publicKey: string | undefined,
    _addressToAddType: string,
  ): Promise<AddAddressMessageToSign> {
    throw new Error("Method 'addAddressMessageToSign' has to be implemented in the subclass.");
  }

  async removeAddressMessageToSign(
    _address: string,
    _publicKey: string | undefined,
    _addressToRemoveType: string,
  ): Promise<RemoveAddressMessageToSign> {
    throw new Error("Method 'removeAddressMessageToSign' has to be implemented in the subclass.");
  }

  async addAddressToMpcSecret(
    _userId: string,
    _message: AddAddressSignatureMessage,
    _signature: string,
  ): Promise<string> {
    throw new Error("Method 'addAddressToMpcSecret' has to be implemented in the subclass.");
  }

  async removeAddressFromMpcSecret(
    _userId: string,
    _message: RemoveAddressSignatureMessage,
    _signature: string,
  ): Promise<string> {
    throw new Error("Method 'removeAddressFromMpcSecret' has to be implemented in the subclass.");
  }
}
