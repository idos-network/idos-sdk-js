import type { EncryptionPasswordStore } from "@idos-network/kwil-infra/actions";

import {
  base64Codec,
  base64Encode,
  hexDecode,
  hexEncode,
  utf8Decode,
  utf8Encode,
} from "@idos-network/utils/codecs";
import { generatePassword } from "@idos-network/utils/cryptography";
import { decrypt, encrypt, keyDerivation } from "@idos-network/utils/encryption";
import { LocalStorageStore, type PipeCodecArgs, type Store } from "@idos-network/utils/store";
import { syncScrypt } from "scrypt-js";
import nacl from "tweetnacl";

import type {
  AddAddressMessageToSign,
  AddAddressSignatureMessage,
  DownloadMessageToSign,
  RemoveAddressMessageToSign,
  RemoveAddressSignatureMessage,
  UploadMessageToSign,
} from "./mpc/types";
import type {
  EnclaveOptions,
  MPCPasswordContext,
  PasswordContext,
  PrivateEncryptionProfile,
  PublicEncryptionProfile,
} from "./types";

import { BaseProvider } from "./base";
import { STORAGE_KEYS } from "./keys";
import { Client as MPCClient } from "./mpc/client";

export interface LocalEnclaveOptions extends EnclaveOptions {
  store?: Store;
  allowedEncryptionStores?: EncryptionPasswordStore[];
  mpcConfiguration?: {
    nodeUrl: string;
    contractAddress: string;
    numMalicious: number;
    numNodes: number;
    numToReconstruct: number;
  };
}

export class LocalEnclave<
  K extends LocalEnclaveOptions = LocalEnclaveOptions,
> extends BaseProvider<K> {
  protected allowedEncryptionStores: EncryptionPasswordStore[];

  // Store for data
  protected store: Store;
  protected storeBase64: Store;
  protected storeObfuscated: Store;
  protected storeObfuscatedBase64: Store;

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
    this.storeObfuscated = this.store.pipeCodec(this.userIdObfuscationCodec());
    this.storeBase64 = this.store.pipeCodec(base64Codec);
    this.storeObfuscatedBase64 = this.store
      .pipeCodec(this.userIdObfuscationCodec())
      .pipeCodec(base64Codec);

    if (options.mpcConfiguration) {
      this.mpcClientInstance = new MPCClient(
        options.mpcConfiguration.nodeUrl,
        options.mpcConfiguration.contractAddress,
        options.mpcConfiguration.numMalicious,
        options.mpcConfiguration.numNodes,
        options.mpcConfiguration.numToReconstruct,
        // TODO: This is weird, we should not be forcing this
        options.walletType ?? "EVM",
        options.walletAddress ?? "",
        options.walletPublicKey,
      );
    }
  }

  /** Obfuscated stores keyed to one user id, so a reconfigure mid-write cannot change the key. */
  private obfuscatedStoresFor(userId: string) {
    const obfuscated = this.store.pipeCodec(this.userIdObfuscationCodec(userId));
    return { obfuscated, obfuscatedBase64: obfuscated.pipeCodec(base64Codec) };
  }

  /** @override parent method to reset the enclave */
  async reset(): Promise<void> {
    await super.reset();
    this.storedEncryptionProfile = undefined;
    await this.store.reset();
  }

  /** @override parent method to reconfigure the enclave */
  async reconfigure(options: Partial<K> = {}): Promise<void> {
    await super.reconfigure(options);
    // Reconfigure MPC client if any signer information changed
    if (this.mpcClientInstance && options.walletType && options.walletAddress) {
      this.mpcClientInstance.reconfigure(
        options.walletType,
        options.walletAddress ?? "",
        options.walletPublicKey,
      );
    }
  }

  /**
   * Return a codec that encrypts/decrypts data using a key derived from the provider's user ID.
   *
   * This ensures that data is minimally obfuscated to avoid low-sophistication attacks.
   */
  private userIdObfuscationCodec(fixedUserId?: string): PipeCodecArgs<string> {
    // oxlint-disable-next-line typescript/no-this-alias -- Needed for `this` in nested encode/decode functions
    const self = this;
    const currentUserId = () => fixedUserId ?? self.options.userId;

    const toKey = (userId: string, salt: Uint8Array) =>
      syncScrypt(utf8Encode(userId), salt, 16384, 8, 1, nacl.secretbox.keyLength);

    return {
      encode(data: string): string {
        const userId = currentUserId();
        if (!userId) {
          throw new Error("User ID required for encryption");
        }

        const dataBytes = utf8Encode(data); // Convert string to Uint8Array
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const salt = nacl.randomBytes(16);
        const key = toKey(userId, salt);
        const payload = nacl.secretbox(dataBytes, nonce, key);

        // Store salt + nonce + ciphertext
        const combined = new Uint8Array(salt.length + nonce.length + payload.length);
        combined.set(salt, 0);
        combined.set(nonce, salt.length);
        combined.set(payload, salt.length + nonce.length);

        return `0x${hexEncode(combined)}`;
      },

      decode(payload: string): string {
        const userId = currentUserId();
        if (!userId) {
          throw new Error("User ID required for decryption");
        }

        if (payload.slice(0, 2) !== "0x") {
          throw new Error(`missing 0x prefix: ${payload}`);
        }

        const combined = hexDecode(payload.slice(2));
        const salt = combined.slice(0, 16);
        const nonce = combined.slice(16, 16 + nacl.secretbox.nonceLength);
        const ciphertext = combined.slice(16 + nacl.secretbox.nonceLength);

        const key = toKey(userId, salt);
        const result = nacl.secretbox.open(ciphertext, nonce, key);

        if (!result) throw new Error("Failed to decrypt data");

        return utf8Decode(result); // Convert Uint8Array back to string
      },
    };
  }
  /** @see parent method extended with loading the profile from the store */
  async load(): Promise<void> {
    await super.load();

    const userId = await this.store.get<string>(STORAGE_KEYS.USER_ID);
    if (userId) this.options.userId = userId;

    let password = await this.storeObfuscated.get<string>(STORAGE_KEYS.OBFUSCATED_PASSWORD);
    if (!password) {
      password = await this.store.get<string>(STORAGE_KEYS.DEPRECATED___PASSWORD);
      if (!password) return;

      await this.storeObfuscated.set(STORAGE_KEYS.OBFUSCATED_PASSWORD, password);
    }
    await this.store.delete(STORAGE_KEYS.DEPRECATED___PASSWORD);

    let encryptionSecretKey = await this.storeObfuscatedBase64.get<Uint8Array>(
      STORAGE_KEYS.OBFUSCATED_BASE64_ENCRYPTION_SECRET_KEY,
    );
    if (!encryptionSecretKey) {
      encryptionSecretKey = await this.storeBase64.get<Uint8Array>(
        STORAGE_KEYS.DEPRECATED___ENCRYPTION_SECRET_KEY,
      );
      if (!encryptionSecretKey) return;

      await this.storeObfuscatedBase64.set(
        STORAGE_KEYS.OBFUSCATED_BASE64_ENCRYPTION_SECRET_KEY,
        encryptionSecretKey,
      );
    }
    await this.store.delete(STORAGE_KEYS.DEPRECATED___ENCRYPTION_SECRET_KEY);
    // Even older version.
    await this.store.delete(STORAGE_KEYS.DEPRECATED___ENCRYPTION_PRIVATE_KEY);

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
      await this.store.set<EncryptionPasswordStore>(
        STORAGE_KEYS.ENCRYPTION_PASSWORD_STORE,
        encryptionPasswordStore,
      );
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
    // The cached profile is a copy of shared storage, which other enclave instances
    // can expire, reset, or replace. Check storage on every key use.
    // Expire even without a cached copy: the unlock below would refresh the deadline
    // and keep an expired profile and its origin grants.
    const cached = this.storedEncryptionProfile;
    if (await this.store.hasRememberDurationElapsed()) {
      await this.reset();
    } else if (cached && !(await this.storeHoldsProfile(cached))) {
      // Storage now belongs to another session: drop the copy, keep their data.
      if (this.storedEncryptionProfile === cached) this.storedEncryptionProfile = undefined;
    }

    // A cached key is only reusable while it still matches the canonical public key;
    // after a rotation it falls through to the unlock below.
    const expectedPublicKey = this.options.expectedUserEncryptionPublicKey;
    if (
      this.storedEncryptionProfile?.userId === this.userId &&
      (!expectedPublicKey ||
        base64Encode(this.storedEncryptionProfile.keyPair.publicKey) === expectedPublicKey)
    ) {
      // A matching cached profile still needs origin authorization before key use.
      // Denying it must keep the profile and the allowlist; only another unlock replaces them.
      const profile = this.storedEncryptionProfile;
      if (!skipGuard && !(await this.guardKeys())) {
        throw new Error("Origin is not authorized to use the keys");
      }

      if (!(await this.isCurrentProfile(profile)))
        return this.getPrivateEncryptionProfile(skipGuard);
      return profile;
    }

    // userId and the expected key come from the parent, so a mismatch must not wipe storage:
    // any embedding page could send one. Drop the copy only. The stored profile and origin
    // grants are replaced once the user unlocks a different profile in the enclave.
    this.storedEncryptionProfile = undefined;

    if (this.options.encryptionPasswordStore === "mm") {
      throw new Error(
        "MM encryption profiles require an externally supplied encryption private key",
      );
    }

    let password: string | undefined;
    let encryptionPasswordStore: EncryptionPasswordStore | undefined;
    let rememberDuration: number | undefined;

    // The password belongs to the user the prompt was opened for. The parent can reconfigure
    // while it is open, so the MPC calls and the saved profile stay bound to that user. If the
    // parent moved on, isCurrentProfile below does not return it and the next call unlocks again.
    const userId = this.userId;
    const context = await this.getPasswordContext();

    if (context.encryptionPasswordStore === "user") {
      rememberDuration = context.duration;
      password = context.password;
      encryptionPasswordStore = context.encryptionPasswordStore;
    }

    if (context.encryptionPasswordStore === "mpc") {
      // TODO: This is resetting duration, but should?
      rememberDuration = undefined;
      password = await this.ensureMPCPassword(userId);
      encryptionPasswordStore = "mpc";
    }

    if (!password || !encryptionPasswordStore) {
      throw new Error("Password or encryption password store is not found");
    }

    // The prompt or MPC download can outlast the deadline: expire the old profile first.
    if (await this.store.hasRememberDurationElapsed()) {
      await this.reset();
    }

    const profile = await this.createEncryptionProfileFromPassword(
      password,
      userId,
      encryptionPasswordStore,
    );
    // Only a saved profile gets a new deadline, so a failed unlock cannot extend the old one.
    await this.store.setRememberDuration(rememberDuration);

    // Same origin check as the cached path. Password or MPC success is not authorization.
    if (!skipGuard && !(await this.guardKeys())) {
      throw new Error("Origin is not authorized to use the keys");
    }

    if (!(await this.isCurrentProfile(profile))) return this.getPrivateEncryptionProfile(skipGuard);
    return profile;
  }

  // Rechecked after guardKeys(), which can wait while the parent reconfigures or storage changes.
  private async isCurrentProfile(profile: PrivateEncryptionProfile): Promise<boolean> {
    const expectedPublicKey = this.options.expectedUserEncryptionPublicKey;
    return (
      this.storedEncryptionProfile === profile &&
      profile.userId === this.options.userId &&
      (!expectedPublicKey || base64Encode(profile.keyPair.publicKey) === expectedPublicKey) &&
      !(await this.store.hasRememberDurationElapsed()) &&
      (await this.storeHoldsProfile(profile))
    );
  }

  /** Called after a new profile overwrites a different stored one. Clear anything tied to the old one. */
  protected async onStoredProfileReplaced(): Promise<void> {}

  private async storeHoldsProfile(profile: PrivateEncryptionProfile): Promise<boolean> {
    if ((await this.store.get<string>(STORAGE_KEYS.USER_ID)) !== profile.userId) return false;

    // Profiles saved before the public key was stored can only be matched by user id.
    const publicKey = await this.storeBase64.get<Uint8Array>(STORAGE_KEYS.ENCRYPTION_PUBLIC_KEY);
    return !publicKey || base64Encode(publicKey) === base64Encode(profile.keyPair.publicKey);
  }

  /**
   * storeHoldsProfile matches profiles saved before the public key was stored by user id only.
   * Compare their secret key too, so a same-user key change still counts as a replacement.
   * Only called when saving a profile: the obfuscated read is too slow for every key use.
   */
  private async storeHoldsLegacySecretKey(secretKey: Uint8Array, userId: string): Promise<boolean> {
    if (await this.store.get(STORAGE_KEYS.ENCRYPTION_PUBLIC_KEY)) return true;

    try {
      const stored = await this.obfuscatedStoresFor(userId).obfuscatedBase64.get<Uint8Array>(
        STORAGE_KEYS.OBFUSCATED_BASE64_ENCRYPTION_SECRET_KEY,
      );
      return !stored || base64Encode(stored) === base64Encode(secretKey);
    } catch {
      // Written under another user id: a different profile.
      return false;
    }
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

    const expectedPublicKey = this.options.expectedUserEncryptionPublicKey;
    if (expectedPublicKey && base64Encode(keyPair.publicKey) !== expectedPublicKey) {
      throw new Error(
        "Derived encryption public key does not match expectedUserEncryptionPublicKey",
      );
    }

    const profile: PrivateEncryptionProfile = {
      userId,
      password,
      keyPair,
      encryptionPasswordStore,
    };
    const { obfuscated, obfuscatedBase64 } = this.obfuscatedStoresFor(userId);
    const replacesStoredProfile =
      !(await this.storeHoldsProfile(profile)) ||
      !(await this.storeHoldsLegacySecretKey(keyPair.secretKey, userId));
    // Before writing: if the cleanup fails, the old profile is still stored and the next unlock retries it.
    if (replacesStoredProfile) await this.onStoredProfileReplaced();

    await this.store.set(STORAGE_KEYS.USER_ID, userId);
    await obfuscated.set(STORAGE_KEYS.OBFUSCATED_PASSWORD, password);
    await this.store.delete(STORAGE_KEYS.DEPRECATED___PASSWORD);
    await this.store.set(STORAGE_KEYS.ENCRYPTION_PASSWORD_STORE, encryptionPasswordStore);
    await obfuscatedBase64.set(
      STORAGE_KEYS.OBFUSCATED_BASE64_ENCRYPTION_SECRET_KEY,
      keyPair.secretKey,
    );
    await this.store.delete(STORAGE_KEYS.DEPRECATED___ENCRYPTION_SECRET_KEY);
    await this.storeBase64.set(STORAGE_KEYS.ENCRYPTION_PUBLIC_KEY, keyPair.publicKey);

    this.storedEncryptionProfile = profile;
    return profile;
  }

  protected async ensureMPCPassword(userId: string = this.userId): Promise<string> {
    if (this.options?.mode !== "new") {
      const { status: downloadStatus, secret: downloadedPassword } =
        await this.downloadSecret(userId);

      if (downloadStatus === "ok" && downloadedPassword) {
        return utf8Decode(downloadedPassword);
      }

      throw Error("A secret might be stored at MPC ZK nodes, but can't be obtained");
    }

    const password = generatePassword();
    const { status: uploadStatus } = await this.uploadSecret(password, userId);

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

  private async downloadSecret(userId: string): Promise<{
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
      userId,
      downloadRequest,
      signedMessage,
      ephemeralKeyPair.secretKey,
    );
  }

  private async uploadSecret(secret: string, userId: string): Promise<{ status: string }> {
    if (!this.options.walletAddress) {
      console.error("signerAddress is not found");
      return { status: "no-signer-address" };
    }

    const blindedShares = this.mpcClient.getBlindedShares(Buffer.from(secret, "utf8"));
    const uploadRequest = this.mpcClient.uploadRequest(blindedShares);
    const messageToSign = this.mpcClient.uploadMessageToSign(uploadRequest) as UploadMessageToSign;

    const signedMessage = await this.signTypedData(
      // oxlint-disable-next-line typescript/no-explicit-any -- TODO: Change this when we know how to MPC & other chains
      messageToSign.domain as any,
      // oxlint-disable-next-line typescript/no-explicit-any -- TODO: Change this when we know how to MPC & other chains
      messageToSign.types as any,
      // oxlint-disable-next-line typescript/no-explicit-any -- TODO: Change this when we know how to MPC & other chains
      messageToSign.value as any,
    );

    return this.mpcClient.uploadSecret(userId, uploadRequest, signedMessage, blindedShares);
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
