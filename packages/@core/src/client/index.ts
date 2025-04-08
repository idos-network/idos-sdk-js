import type { KwilSigner } from "@kwilteam/kwil-js";
import invariant from "tiny-invariant";

import { base64Decode, base64Encode, hexEncodeSha256Hash } from "../codecs";
import { type EnclaveOptions, type EnclaveProvider, IframeEnclave } from "../enclave";
import {
  type ShareableCredential,
  createAttribute,
  createCredentialCopy,
  getAccessGrantsOwned,
  getAllCredentials,
  getAttributes,
  getCredentialById,
  getCredentialOwned,
  getUserProfile,
  hasProfile,
  type idOSDAGSignatureParams,
  removeCredential,
  requestDAGMessage,
  requestDWGMessage,
  shareCredential,
} from "../kwil-actions";
import { type KwilActionClient, createClientKwilSigner, createWebKwilClient } from "../kwil-infra";
import { Store } from "../store";
import type { DelegatedWriteGrant, Wallet, idOSUser, idOSUserAttribute } from "../types";
import { buildInsertableIDOSCredential } from "../utils";

type Properties<T> = {
  // biome-ignore lint/complexity/noBannedTypes: All functions are to be removed.
  [K in keyof T as Exclude<T[K], Function> extends never ? never : K]: T[K];
};

export type idOSClient =
  | idOSClientConfiguration
  | idOSClientIdle
  | idOSClientWithUserSigner
  | idOSClientLoggedIn;

export class idOSClientConfiguration {
  readonly state: "configuration";
  readonly chainId?: string;
  readonly nodeUrl: string;
  readonly enclaveOptions: Omit<EnclaveOptions, "mode">;

  constructor(params: {
    chainId?: string;
    nodeUrl: string;
    enclaveOptions: Omit<EnclaveOptions, "mode">;
  }) {
    this.state = "configuration";
    this.chainId = params.chainId;
    this.nodeUrl = params.nodeUrl;
    this.enclaveOptions = params.enclaveOptions;
  }

  async createClient(): Promise<idOSClientIdle> {
    return idOSClientIdle.fromConfig(this);
  }
}

export class idOSClientIdle {
  readonly state: "idle";
  readonly store: Store;
  readonly kwilClient: KwilActionClient;
  readonly enclaveProvider: EnclaveProvider;

  constructor(store: Store, kwilClient: KwilActionClient, enclaveProvider: EnclaveProvider) {
    this.state = "idle";
    this.store = store;
    this.kwilClient = kwilClient;
    this.enclaveProvider = enclaveProvider;
  }

  static async fromConfig(params: idOSClientConfiguration): Promise<idOSClientIdle> {
    const store = new Store(window.localStorage);
    const kwilClient = await createWebKwilClient({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    const enclaveProvider = new IframeEnclave({ ...params.enclaveOptions });
    await enclaveProvider.load();

    return new idOSClientIdle(store, kwilClient, enclaveProvider);
  }

  async addressHasProfile(address: string): Promise<boolean> {
    return hasProfile(this.kwilClient, address);
  }

  async withUserSigner(signer: Wallet): Promise<idOSClientWithUserSigner> {
    const [kwilSigner, walletIdentifier] = await createClientKwilSigner(
      this.store,
      this.kwilClient,
      signer,
    );
    this.kwilClient.setSigner(kwilSigner);

    return new idOSClientWithUserSigner(this, signer, kwilSigner, walletIdentifier);
  }

  async logOut(): Promise<idOSClientIdle> {
    return this;
  }
}

export class idOSClientWithUserSigner implements Omit<Properties<idOSClientIdle>, "state"> {
  readonly state: "with-user-signer";
  readonly store: Store;
  readonly kwilClient: KwilActionClient;
  readonly enclaveProvider: EnclaveProvider;
  readonly signer: Wallet;
  readonly kwilSigner: KwilSigner;
  readonly walletIdentifier: string;

  constructor(
    idOSClientIdle: idOSClientIdle,
    signer: Wallet,
    kwilSigner: KwilSigner,
    walletIdentifier: string,
  ) {
    this.state = "with-user-signer";
    this.store = idOSClientIdle.store;
    this.kwilClient = idOSClientIdle.kwilClient;
    this.enclaveProvider = idOSClientIdle.enclaveProvider;
    this.signer = signer;
    this.kwilSigner = kwilSigner;
    this.walletIdentifier = walletIdentifier;
  }

  async logOut(): Promise<idOSClientIdle> {
    this.kwilClient.setSigner(undefined);
    await this.enclaveProvider.reset();
    return new idOSClientIdle(this.store, this.kwilClient, this.enclaveProvider);
  }

  async hasProfile(): Promise<boolean> {
    return hasProfile(this.kwilClient, this.walletIdentifier);
  }

  async getUserEncryptionPublicKey(userId: string): Promise<string> {
    await this.enclaveProvider.reconfigure({ mode: "new" });
    const { userEncryptionPublicKey } =
      await this.enclaveProvider.discoverUserEncryptionPublicKey(userId);
    return userEncryptionPublicKey;
  }

  async logIn(): Promise<idOSClientLoggedIn> {
    if (!(await this.hasProfile())) throw new Error("User does not have a profile");

    await this.enclaveProvider.reconfigure({ mode: "existing" });
    const kwilUser = await getUserProfile(this.kwilClient);

    return new idOSClientLoggedIn(this, kwilUser);
  }
}

export class idOSClientLoggedIn implements Omit<Properties<idOSClientWithUserSigner>, "state"> {
  readonly state: "logged-in";
  readonly store: Store;
  readonly kwilClient: KwilActionClient;
  readonly enclaveProvider: EnclaveProvider;
  readonly signer: Wallet;
  readonly kwilSigner: KwilSigner;
  readonly walletIdentifier: string;
  readonly user: idOSUser;

  constructor(idOSClientWithUserSigner: idOSClientWithUserSigner, user: idOSUser) {
    this.state = "logged-in";
    this.store = idOSClientWithUserSigner.store;
    this.kwilClient = idOSClientWithUserSigner.kwilClient;
    this.enclaveProvider = idOSClientWithUserSigner.enclaveProvider;
    this.signer = idOSClientWithUserSigner.signer;
    this.kwilSigner = idOSClientWithUserSigner.kwilSigner;
    this.walletIdentifier = idOSClientWithUserSigner.walletIdentifier;
    this.user = user;
  }

  async logOut(): Promise<idOSClientIdle> {
    this.kwilClient.setSigner(undefined);
    await this.enclaveProvider.reset();
    return new idOSClientIdle(this.store, this.kwilClient, this.enclaveProvider);
  }

  async requestDWGMessage(params: DelegatedWriteGrant): Promise<string> {
    return requestDWGMessage(this.kwilClient, params);
  }

  async removeCredential(id: string) {
    return await removeCredential(this.kwilClient, id);
  }

  async getCredentialById(id: string) {
    return getCredentialById(this.kwilClient, id);
  }

  async shareCredential(credential: ShareableCredential) {
    return shareCredential(this.kwilClient, credential);
  }

  async getAllCredentials() {
    return getAllCredentials(this.kwilClient);
  }

  async getAccessGrantsOwned() {
    return getAccessGrantsOwned(this.kwilClient);
  }

  async getCredentialOwned(id: string) {
    return getCredentialOwned(this.kwilClient, id);
  }

  async getAttributes() {
    return getAttributes(this.kwilClient);
  }

  async createAttribute(attribute: idOSUserAttribute) {
    return createAttribute(this.kwilClient, attribute);
  }

  async getCredentialContentSha256Hash(id: string) {
    const credential = await getCredentialById(this.kwilClient, id);

    invariant(credential, `"idOSCredential" with id ${id} not found`);

    await this.enclaveProvider.ready(this.user.id, this.user.recipient_encryption_public_key);

    const plaintext = await this.enclaveProvider.decrypt(
      base64Decode(credential.content),
      base64Decode(credential.encryptor_public_key),
    );

    return hexEncodeSha256Hash(plaintext);
  }

  async createCredentialCopy(
    id: string,
    consumerRecipientEncryptionPublicKey: string,
    consumerAddress: string,
    lockedUntil: number,
  ) {
    const originalCredential = await getCredentialById(this.kwilClient, id);
    invariant(originalCredential, `"idOSCredential" with id ${id} not found`);

    await this.enclaveProvider.ready(this.user.id, this.user.recipient_encryption_public_key);

    const decryptedContent = await this.enclaveProvider.decrypt(
      base64Decode(originalCredential.content),
      base64Decode(originalCredential.encryptor_public_key),
    );
    const { content, encryptorPublicKey } = await this.enclaveProvider.encrypt(
      decryptedContent,
      base64Decode(consumerRecipientEncryptionPublicKey),
    );

    const insertableCredential = {
      ...(await buildInsertableIDOSCredential(
        originalCredential.user_id,
        "",
        base64Encode(content),
        consumerRecipientEncryptionPublicKey,
        base64Encode(encryptorPublicKey),
      )),
      grantee_wallet_identifier: consumerAddress,
      locked_until: lockedUntil,
    };

    const copyId = crypto.randomUUID();

    await createCredentialCopy(this.kwilClient, {
      original_credential_id: originalCredential.id,
      ...originalCredential,
      ...insertableCredential,
      id: copyId,
    });

    return { id: copyId };
  }

  async requestDAGMessage(params: idOSDAGSignatureParams) {
    return requestDAGMessage(this.kwilClient, params);
  }
}
