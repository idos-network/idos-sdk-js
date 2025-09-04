import * as Base64Codec from "@stablelib/base64";
import nacl from "tweetnacl";
import { base64Encode, utf8Decode } from "../codecs";
import { decrypt, encrypt, keyDerivation } from "../encryption";
import { Client as MPCClient } from "../mpc/client";
import type {
  AddAddressMessageToSign,
  AddAddressSignatureMessage,
  DownloadMessageToSign,
  RemoveAddressMessageToSign,
  RemoveAddressSignatureMessage,
  UploadMessageToSign,
} from "../mpc/types";
import { LocalStorageStore, type Store } from "../store";
import { BaseProvider } from "./base";
import { STORAGE_KEYS } from "./keys";
import type {
  EnclaveOptions,
  EncryptionPasswordStore,
  MPCPasswordContext,
  PasswordContext,
  PrivateEncryptionProfile,
  PublicEncryptionProfile,
} from "./types";

export interface LocalEnclaveOptions extends EnclaveOptions {
  store?: Store;
  allowedEncryptionStores?: EncryptionPasswordStore[];
  mpcConfiguration?: {
    nodeUrl: string;
    contractAddress: string;
  };
}

export class LocalEnclave<
  K extends LocalEnclaveOptions = LocalEnclaveOptions,
> extends BaseProvider<K> {
  protected allowedEncryptionStores: EncryptionPasswordStore[];

  // Store for data
  protected store: Store;
  protected storeWithCodec: Store;

  // In case of MPC usage
  protected mpcClientInstance?: MPCClient;

  // Stored key pair and user id for that key pair
  // those are most likely loaded from the store
  // during the load() method.
  protected storedEncryptionProfile?: PrivateEncryptionProfile;

  constructor(options: K) {
    super(options);

    // By default, we only allow password auth method
    this.allowedEncryptionStores = options.allowedEncryptionStores ?? ["user"];
    this.store = options.store ?? new LocalStorageStore();
    this.storeWithCodec = this.store.pipeCodec<Uint8Array<ArrayBufferLike>>(Base64Codec);

    console.log({ options });
    if (options.mpcConfiguration) {
      this.mpcClientInstance = new MPCClient(
        options.mpcConfiguration.nodeUrl,
        options.mpcConfiguration.contractAddress,
        options.walletType,
        options.walletAddress,
        options.walletPublicKey,
      );
    }
  }

  /** @override parent method to reset the enclave */
  async reset(): Promise<void> {
    await super.reset();
    this.storedEncryptionProfile = undefined;
    this.store.reset();
  }

  /** @override parent method to reconfigure the enclave */
  async reconfigure(options: Partial<K> = {}): Promise<void> {
    await super.reconfigure(options);
    console.log({ reconfigureOptions: options });
    // Reconfigure MPC client if any signer information changed
    if (this.mpcClientInstance && options.walletType && options.walletAddress) {
      this.mpcClientInstance.reconfigure(
        options.walletType,
        options.walletAddress,
        options.walletPublicKey,
      );
    }
  }

  /** @see parent method extended with loading the profile from the store */
  async load(): Promise<void> {
    await super.load();

    const password = await this.store.get<string>(STORAGE_KEYS.PASSWORD);
    const userId = await this.store.get<string>(STORAGE_KEYS.USER_ID);
    const encryptionSecretKey = await this.storeWithCodec.get<Uint8Array<ArrayBufferLike>>(
      STORAGE_KEYS.ENCRYPTION_SECRET_KEY,
    );

    if (!password || !userId || !encryptionSecretKey) {
      return;
    }

    let encryptionPasswordStore = await this.store.get<EncryptionPasswordStore>(
      STORAGE_KEYS.ENCRYPTION_PASSWORD_STORE,
    );

    // Migration from "password" to "user"
    // TODO: Remove this after a while
    if (!encryptionPasswordStore || (encryptionPasswordStore as string) === "password") {
      encryptionPasswordStore = "user";
    }

    this.storedEncryptionProfile = {
      userId,
      password,
      keyPair: nacl.box.keyPair.fromSecretKey(encryptionSecretKey),
      encryptionPasswordStore,
    };
  }

  /**
   * Encrypts a message to a receiver.
   * This method also checks if the user is authorized to use the keys.
   *
   * @param message - The message to encrypt.
   * @param receiverPublicKey - The public key of the receiver.
   *
   * @returns The encrypted message.
   */
  async encrypt(
    message: Uint8Array,
    receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    const { keyPair } = await this.getPrivateEncryptionProfile();
    return encrypt(message, keyPair.publicKey, receiverPublicKey);
  }

  /**
   * Decrypts a message from a sender.
   * This method also checks if the user is authorized to use the keys.
   *
   * @param message - The message to decrypt.
   * @param senderPublicKey - The public key of the sender.
   *
   * @returns The decrypted message.
   */
  async decrypt(
    message: Uint8Array,
    senderPublicKey: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    const { keyPair } = await this.getPrivateEncryptionProfile();
    return decrypt(message, keyPair, senderPublicKey);
  }

  /**
   * @see BaseProvider#getPrivateEncryptionProfile
   */
  async getPrivateEncryptionProfile(skipGuard = false): Promise<PrivateEncryptionProfile> {
    // In case there is a no key pair, which matches we don't need a new one.
    if (this.storedEncryptionProfile) {
      let canBeUsed = this.storedEncryptionProfile.userId === this.userId;

      if (canBeUsed && !skipGuard) {
        // When users matches, we also need to check
        // if origin is authorized to use the keys.
        canBeUsed = await this.guardKeys();
      }

      if (canBeUsed) {
        return this.storedEncryptionProfile;
      }

      // Something did not match, we need to create a new key pair
      // and reset the enclave.
      await this.reset();
    }

    // The stored profile can't be used, or we have to create a new one.
    let password: string | undefined;
    let encryptionPasswordStore: EncryptionPasswordStore | undefined;

    const context = await this.getPasswordContext();

    if (context.encryptionPasswordStore === "user") {
      await this.store.setRememberDuration(context.duration);

      password = context.password;
      encryptionPasswordStore = context.encryptionPasswordStore;
    }

    if (context.encryptionPasswordStore === "mpc") {
      // TODO: This is resetting duration, but should?
      await this.store.setRememberDuration(undefined);

      password = await this.ensureMPCPassword();
      encryptionPasswordStore = "mpc";
    }

    if (!password || !encryptionPasswordStore) {
      throw new Error("Password or encryption password store is not found");
    }

    return this.createEncryptionProfileFromPassword(password, this.userId, encryptionPasswordStore);
  }

  /** @see BaseProvider#ensureUserEncryptionProfile */
  async ensureUserEncryptionProfile(): Promise<PublicEncryptionProfile> {
    const { keyPair, encryptionPasswordStore, userId } = await this.getPrivateEncryptionProfile();

    return {
      userId,
      userEncryptionPublicKey: base64Encode(keyPair.publicKey),
      encryptionPasswordStore: encryptionPasswordStore,
    };
  }

  /**
   * This method needs to check `options` and should derive the password context from it.
   *
   * @returns The password context.
   */
  async getPasswordContext(): Promise<PasswordContext | MPCPasswordContext> {
    throw new Error("Method 'getPasswordContext' has to be implemented in the subclass.");
  }

  /**
   * Creates and store encryption profile from a password.
   *
   * @param password - The password to use.
   * @param userId - The user id to use.
   * @param encryptionPasswordStore - The encryption password store to use.
   *
   * @returns The encryption profile.
   */
  async createEncryptionProfileFromPassword(
    password: string,
    userId: string,
    encryptionPasswordStore: EncryptionPasswordStore,
  ): Promise<PrivateEncryptionProfile> {
    const secretKey = await keyDerivation(password, userId);

    const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    await this.store.set(STORAGE_KEYS.USER_ID, userId);
    await this.store.set(STORAGE_KEYS.PASSWORD, password);
    await this.store.set(STORAGE_KEYS.ENCRYPTION_PASSWORD_STORE, encryptionPasswordStore);
    await this.storeWithCodec.set(STORAGE_KEYS.ENCRYPTION_SECRET_KEY, keyPair.secretKey);
    await this.storeWithCodec.set(STORAGE_KEYS.ENCRYPTION_PUBLIC_KEY, keyPair.publicKey);

    this.storedEncryptionProfile = {
      userId,
      password,
      keyPair,
      encryptionPasswordStore,
    };

    return this.storedEncryptionProfile;
  }

  protected async ensureMPCPassword(): Promise<string> {
    if (this.options?.mode !== "new") {
      const { status: downloadStatus, secret: downloadedPassword } = await this.downloadSecret();

      if (downloadStatus === "ok" && downloadedPassword) {
        return utf8Decode(downloadedPassword);
      }

      // TODO: If user change their mind and want to use MPC instead of password?...
      // throw Error("A secret might be stored at ZK nodes, but can't be obtained");
    }

    const password = this.generatePassword();
    const { status: uploadStatus } = await this.uploadSecret(password);

    if (uploadStatus !== "success") {
      throw Error(`A secret upload failed with status: ${uploadStatus}`);
    }

    return password;
  }

  private get mpcClient(): MPCClient {
    if (!this.mpcClientInstance) {
      throw new Error("MPC client is not initialized");
    }
    return this.mpcClientInstance;
  }

  private generatePassword(): string {
    const alphabet =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const length = 20;
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += alphabet[array[i] % alphabet.length];
    }

    return password;
  }

  private async downloadSecret(): Promise<{
    status: string;
    secret: Buffer<ArrayBufferLike> | undefined;
  }> {
    // I really don't like this, I guess the walletAddress should be stored in the store.
    if (!this.options.walletAddress) {
      throw new Error("walletAddress is not found");
    }

    const ephemeralKeyPair = nacl.box.keyPair();

    const downloadRequest = this.mpcClient.downloadRequest(ephemeralKeyPair.publicKey);

    const messageToSign = this.mpcClient.downloadMessageToSign(
      downloadRequest,
    ) as DownloadMessageToSign;

    const signedMessage = await this.signTypedData(
      messageToSign.domain,
      messageToSign.types,
      messageToSign.value,
    );

    return this.mpcClient.downloadSecret(
      this.userId,
      downloadRequest,
      signedMessage,
      ephemeralKeyPair.secretKey,
    );
  }

  private async uploadSecret(secret: string): Promise<{ status: string }> {
    const signerAddress = this.options.walletAddress;

    if (!signerAddress) {
      console.error("signerAddress is not found");
      return { status: "no-signer-address" };
    }

    const blindedShares = this.mpcClient.getBlindedShares(Buffer.from(secret, "utf8"));
    const uploadRequest = this.mpcClient.uploadRequest(blindedShares);
    const messageToSign = this.mpcClient.uploadMessageToSign(uploadRequest) as UploadMessageToSign;

    const signedMessage = await this.signTypedData(
      // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
      messageToSign.domain as any,
      // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
      messageToSign.types as any,
      // biome-ignore lint/suspicious/noExplicitAny: TODO: Change this when we know how to MPC & other chains
      messageToSign.value as any,
    );

    return this.mpcClient.uploadSecret(this.userId, uploadRequest, signedMessage, blindedShares);
  }

  async addAddressMessageToSign(
    address: string,
    publicKey: string | undefined,
    addressToAddType: string,
  ): Promise<AddAddressMessageToSign> {
    return this.mpcClient.addAddressMessageToSign(
      address,
      publicKey,
      addressToAddType,
    ) as AddAddressMessageToSign;
  }

  async removeAddressMessageToSign(
    address: string,
    publicKey: string | undefined,
    addressToRemoveType: string,
  ): Promise<RemoveAddressMessageToSign> {
    return this.mpcClient.removeAddressMessageToSign(
      address,
      publicKey,
      addressToRemoveType,
    ) as RemoveAddressMessageToSign;
  }

  async addAddressToMpcSecret(
    userId: string,
    message: AddAddressSignatureMessage,
    signature: string,
  ): Promise<string> {
    return this.mpcClient.addAddress(userId, message, signature);
  }

  async removeAddressFromMpcSecret(
    userId: string,
    message: RemoveAddressSignatureMessage,
    signature: string,
  ): Promise<string> {
    return this.mpcClient.removeAddress(userId, message, signature);
  }
}
