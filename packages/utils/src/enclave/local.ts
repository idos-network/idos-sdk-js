import * as Base64Codec from "@stablelib/base64";
import nacl from "tweetnacl";
import { decrypt, encrypt, keyDerivation } from "../encryption";
import { Client as MPCClient } from "../mpc/client";
import { LocalStorageStore, type Store } from "../store";
import { BaseProvider } from "./base";
import type { AuthMethod, EnclaveOptions, StoredData } from "./types";

export interface LocalEnclaveOptions extends EnclaveOptions {
  store?: Store;
  allowedAuthMethods?: AuthMethod[];
  mpcConfiguration?: {
    nodeUrl: string;
    contractAddress: string;
  };
}

export class LocalEnclave extends BaseProvider<LocalEnclaveOptions> {
  protected keyPair: nacl.BoxKeyPair | null = null;
  protected authMethod?: AuthMethod;
  protected allowedAuthMethods: AuthMethod[];

  // This is used in the derived class to check if the user password is correct
  protected userId?: string;
  protected expectedUserEncryptionPublicKey?: string;

  // Store for data
  protected store: Store;
  protected storeWithCodec: Store;

  // In case of MPC usage
  protected mpcClientInstance?: MPCClient;

  constructor(options: LocalEnclaveOptions) {
    super(options);

    // By default, we only allow password auth method
    this.allowedAuthMethods = options.allowedAuthMethods ?? ["password"];
    this.store = options.store ?? new LocalStorageStore();
    this.storeWithCodec = this.store.pipeCodec<Uint8Array<ArrayBufferLike>>(Base64Codec);

    if (options.mpcConfiguration) {
      this.mpcClientInstance = new MPCClient(
        options.mpcConfiguration.nodeUrl,
        options.mpcConfiguration.contractAddress,
      );
    }
  }

  async reset(): Promise<void> {
    this.store.reset();
    this.authMethod = undefined;
    this.keyPair = null;
  }

  get mpcClient(): MPCClient {
    if (!this.mpcClientInstance) {
      throw new Error("MPC client is not initialized");
    }
    return this.mpcClientInstance;
  }

  async load(): Promise<void> {
    await super.load();

    const secretKey =
      await this.storeWithCodec.get<Uint8Array<ArrayBufferLike>>("encryption-private-key");

    if (secretKey) await this.setKeyPair(secretKey);

    // Load auth method from store
    this.authMethod = await this.store.get<AuthMethod>("preferred-auth-method");

    if (this.authMethod && !this.options.allowedAuthMethods?.includes(this.authMethod)) {
      // We don't allow this auth method, reset the enclave
      this.authMethod = undefined;
      await this.reset();
    }
  }

  async storage(userId: string, expectedUserEncryptionPublicKey?: string): Promise<StoredData> {
    const storedUserId = await this.store.get<string>("user-id");
    const storedEncryptionPublicKey =
      await this.storeWithCodec.get<Uint8Array<ArrayBufferLike>>("encryption-public-key");

    if (storedUserId !== userId) await this.store.reset();

    userId && (await this.store.set("user-id", userId));

    // This will be used later in ready method
    this.userId = userId;
    this.expectedUserEncryptionPublicKey = expectedUserEncryptionPublicKey;

    if (userId !== storedUserId) {
      return { userId: "" };
    }

    return {
      userId: storedUserId,
      encryptionPublicKey: storedEncryptionPublicKey,
    };
  }

  async keys(): Promise<Uint8Array | undefined> {
    let secretKey =
      await this.storeWithCodec.get<Uint8Array<ArrayBufferLike>>("encryption-private-key");

    if (!secretKey) {
      const { authMethod, password, duration } = await this.chooseAuthAndPassword();

      if (!authMethod || !this.allowedAuthMethods.includes(authMethod)) {
        throw new Error(`Invalid auth method: ${authMethod}`);
      }

      // Set or clear the remember duration
      await this.store.setRememberDuration(duration);

      if (authMethod === "password" && password) {
        if (!this.userId) {
          throw new Error("userId is not found");
        }

        const salt = this.userId;
        secretKey = await keyDerivation(password, salt);
      } else if (authMethod === "mpc") {
        secretKey = await this.ensureMPCPrivateKey();
      }

      await this.store.set("preferred-auth-method", authMethod);
    }

    if (!secretKey) {
      throw new Error("secretKey is not found");
    }

    await this.setKeyPair(secretKey);

    return this.keyPair?.publicKey;
  }

  // This method needs to be implemented in the subclass
  async chooseAuthAndPassword(): Promise<{
    authMethod: AuthMethod;
    password?: string;
    duration?: number;
  }> {
    throw new Error("Method 'chooseAuthAndPassword' has to be implemented in the subclass.");
  }

  // chooseAuthAndPassword & confirm method needs to be implemented

  async encrypt(
    message: Uint8Array,
    receiverPublicKey: Uint8Array,
  ): Promise<{ content: Uint8Array; encryptorPublicKey: Uint8Array }> {
    if (!this.keyPair) await this.keys();

    if (!this.keyPair) throw new Error("Key pair not initialized");

    return encrypt(message, this.keyPair.publicKey, receiverPublicKey);
  }

  async decrypt(
    message: Uint8Array,
    senderPublicKey: Uint8Array,
  ): Promise<Uint8Array<ArrayBufferLike>> {
    if (!this.keyPair) await this.keys();

    if (!this.keyPair) throw new Error("Key pair not initialized");

    return decrypt(message, this.keyPair, senderPublicKey);
  }

  async setKeyPair(secretKey: Uint8Array<ArrayBufferLike>): Promise<void> {
    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    await this.storeWithCodec.set("encryption-private-key", this.keyPair.secretKey);
    await this.storeWithCodec.set("encryption-public-key", this.keyPair.publicKey);
  }

  async backupPasswordOrSecret(): Promise<void> {
    const abortController = new AbortController();

    /*window.addEventListener(
      "message",
      async (event) => {
        if (event.data.type !== "idOS:store") return;

        let status = "";

        try {
          status = "success";
        } catch (_) {
          status = "failure";
        }

        event.ports[0].postMessage({
          result: {
            type: "idOS:store",
            status,
          },
        });
        event.ports[0].close();
        abortController.abort();
      },
      { signal: abortController.signal },
    );*/

    try {
      await this.backupPasswordOrSecret();
    } catch (error) {
      console.error(error);
    }
  }

  async ensureMPCPrivateKey(): Promise<Uint8Array<ArrayBufferLike>> {
    if (this.options?.mode !== "new") {
      const { status: downloadStatus, secret: downloadedSecret } = await this.downloadSecret();

      if (downloadStatus === "ok" && downloadedSecret) {
        return downloadedSecret as any;
      }

      // TODO: If user change their mind and want to use MPC instead of password?...
      // throw Error("A secret might be stored at ZK nodes, but can't be obtained");
    }

    const privateKey = nacl.box.keyPair().secretKey;
    const { status: uploadStatus } = await this.uploadSecret(privateKey);

    if (uploadStatus !== "success") {
      throw Error(`A secret upload failed with status: ${uploadStatus}`);
    }

    return privateKey;
  }

  async downloadSecret(): Promise<{ status: string; secret: Buffer | undefined }> {
    if (!this.userId) {
      throw new Error("userId is not found");
    }

    if (!this.options.walletAddress) {
      throw new Error("walletAddress is not found");
    }

    const ephemeralKeyPair = nacl.box.keyPair();
    const signerAddress = this.options.walletAddress;

    const downloadRequest = this.mpcClient.downloadRequest(
      signerAddress,
      ephemeralKeyPair.publicKey,
    );

    const messageToSign = this.mpcClient.downloadMessageToSign(downloadRequest);

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

  async uploadSecret(secret: Uint8Array<ArrayBufferLike>): Promise<{ status: string }> {
    if (!this.userId) {
      throw new Error("userId is not found");
    }

    const signerAddress = this.options.walletAddress;

    if (!signerAddress) {
      console.error("signerAddress is not found");
      return { status: "no-signer-address" };
    }

    const blindedShares = this.mpcClient.getBlindedShares(Buffer.from(secret));
    const uploadRequest = this.mpcClient.uploadRequest(blindedShares, signerAddress);
    const messageToSign = this.mpcClient.uploadMessageToSign(uploadRequest);

    const signedMessage = await this.signTypedData(
      messageToSign.domain as any,
      messageToSign.types as any,
      messageToSign.value as any,
    );

    return this.mpcClient.uploadSecret(this.userId, uploadRequest, signedMessage, blindedShares);
  }
}
