import {
  base64Decode,
  base64Encode,
  hexEncodeSha256Hash,
  utf8Decode,
  utf8Encode,
} from "@idos-network/core/codecs";
import {
  type AddWalletParams,
  addWallet,
  addWallets,
  createAttribute,
  createCredentialCopy,
  type GetGrantsParams,
  getAccessGrantsOwned,
  getAllCredentials,
  getAttributes,
  getCredentialById,
  getCredentialOwned,
  getGrants,
  getGrantsCount,
  getSharedCredential,
  getUserProfile,
  getWallets,
  hasProfile,
  type idOSDAGSignatureParams,
  removeCredential,
  removeWallet,
  removeWallets,
  requestDAGMessage,
  requestDWGMessage,
  revokeAccessGrant,
  type ShareableCredential,
  shareCredential,
} from "@idos-network/core/kwil-actions";
import {
  createClientKwilSigner,
  createWebKwilClient,
  type KwilActionClient,
  signNearMessage,
} from "@idos-network/core/kwil-infra";
import type {
  DelegatedWriteGrant,
  idOSCredential,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
  Wallet,
} from "@idos-network/core/types";
import { buildInsertableIDOSCredential } from "@idos-network/core/utils";
import { LocalStorageStore, type Store } from "@idos-network/utils/store";
import type { KwilSigner } from "@kwilteam/kwil-js";
import { negate } from "es-toolkit";
import { every, get } from "es-toolkit/compat";
import invariant from "tiny-invariant";
import { type EnclaveOptions, type EnclaveProvider, IframeEnclave } from "./enclave";

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
  readonly store: Store;

  constructor(params: {
    chainId?: string;
    nodeUrl: string;
    enclaveOptions: Omit<EnclaveOptions, "mode">;
    store?: Store;
  }) {
    this.state = "configuration";
    this.chainId = params.chainId;
    this.nodeUrl = params.nodeUrl;
    this.enclaveOptions = params.enclaveOptions;
    this.store = params.store ?? new LocalStorageStore();
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
    const store = params.store;

    const kwilClient = await createWebKwilClient({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    const storedSignerAddress = await store.get<string>("signer-address");

    const enclaveProvider = new IframeEnclave({ ...params.enclaveOptions });
    await enclaveProvider.load(storedSignerAddress);

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
    window.addEventListener("message", this.onMessage.bind(this));
  }

  async onMessage(message: MessageEvent): Promise<void> {
    const types = ["idOS-MPC:signMessage"];
    if (!types.includes(message.data.type)) return;

    console.log("message to sign on client", message);
    // @ts-ignore type collapse :)
    const payload = message.data.payload;
    const signature = await this.signer.signTypedData(payload.domain, payload.types, payload.value);
    const response = {
      status: "success",
      data: signature,
    };
    message.ports[0].postMessage(response);
    message.ports[0].close();
  }

  async logOut(): Promise<idOSClientIdle> {
    this.kwilClient.setSigner(undefined);
    return new idOSClientIdle(this.store, this.kwilClient, this.enclaveProvider);
  }

  async hasProfile(): Promise<boolean> {
    return hasProfile(this.kwilClient, this.walletIdentifier);
  }

  async getUserEncryptionPublicKey(userId: string): Promise<string> {
    await this.enclaveProvider.reconfigure({
      mode: "new",
      walletAddress: this.walletIdentifier,
    });
    const { userEncryptionPublicKey } =
      await this.enclaveProvider.discoverUserEncryptionPublicKey(userId);
    return userEncryptionPublicKey;
  }

  async logIn(): Promise<idOSClientLoggedIn> {
    if (!(await this.hasProfile())) throw new Error("User does not have a profile");

    await this.enclaveProvider.reconfigure({
      mode: "existing",
      walletAddress: this.walletIdentifier,
    });
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
    return new idOSClientIdle(this.store, this.kwilClient, this.enclaveProvider);
  }

  async requestDWGMessage(params: DelegatedWriteGrant): Promise<string> {
    return requestDWGMessage(this.kwilClient, params);
  }

  async removeCredential(id: string): Promise<{ id: string }> {
    return await removeCredential(this.kwilClient, id);
  }

  async getCredentialById(id: string): Promise<idOSCredential | undefined> {
    return getCredentialById(this.kwilClient, id);
  }

  async shareCredential(credential: ShareableCredential): Promise<ShareableCredential> {
    return shareCredential(this.kwilClient, credential);
  }

  async getAllCredentials(): Promise<idOSCredential[]> {
    return getAllCredentials(this.kwilClient);
  }

  async getAccessGrantsOwned(): Promise<idOSGrant[]> {
    return getAccessGrantsOwned(this.kwilClient);
  }

  async getCredentialOwned(id: string): Promise<idOSCredential | undefined> {
    return getCredentialOwned(this.kwilClient, id);
  }

  async getAttributes(): Promise<idOSUserAttribute[]> {
    return getAttributes(this.kwilClient);
  }

  async createAttribute(attribute: idOSUserAttribute): Promise<idOSUserAttribute> {
    return createAttribute(this.kwilClient, attribute);
  }

  async getCredentialContentSha256Hash(id: string): Promise<string> {
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
  ): Promise<{ id: string }> {
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

  async requestDAGMessage(params: idOSDAGSignatureParams): Promise<string> {
    return requestDAGMessage(this.kwilClient, params);
  }

  async getGrants(params: GetGrantsParams): Promise<{ grants: idOSGrant[]; totalCount: number }> {
    return {
      grants: await getGrants(this.kwilClient, params),
      totalCount: await this.getGrantsCount(),
    };
  }

  async addWallets(params: AddWalletParams[]): Promise<AddWalletParams[]> {
    return addWallets(this.kwilClient, params);
  }

  async getGrantsCount(): Promise<number> {
    return getGrantsCount(this.kwilClient);
  }

  async getSharedCredential(id: string): Promise<idOSCredential | undefined> {
    return getSharedCredential(this.kwilClient, id);
  }

  async revokeAccessGrant(grantId: string): Promise<{ id: string }> {
    return revokeAccessGrant(this.kwilClient, grantId);
  }

  async addWallet(params: AddWalletParams): Promise<AddWalletParams> {
    return addWallet(this.kwilClient, params);
  }

  async getWallets(): Promise<idOSWallet[]> {
    return getWallets(this.kwilClient);
  }

  async removeWallet(id: string): Promise<{ id: string }> {
    return removeWallet(this.kwilClient, id);
  }

  async removeWallets(ids: string[]): Promise<string[]> {
    return removeWallets(this.kwilClient, ids);
  }

  async filterCredentials(requirements: {
    acceptedIssuers: {
      authPublicKey: string;
    }[];
    publicNotesFieldFilters?: {
      pick: Record<string, unknown[]>;
      omit: Record<string, unknown[]>;
    };
    privateFieldFilters?: {
      pick: Record<string, unknown[]>;
      omit: Record<string, unknown[]>;
    };
  }): Promise<idOSCredential[]> {
    const matchCriteria = (content: Record<string, unknown>, criteria: Record<string, unknown[]>) =>
      every(Object.entries(criteria), ([path, targetSet]) =>
        targetSet.includes(get(content, path)),
      );

    const credentials = await this.getAllCredentials();
    const originalCredentials = credentials.filter(
      (cred) => !cred.original_id && !!cred.public_notes,
    );

    // invariant(originalCredentials.length, "No original credentials found");
    let result = originalCredentials.filter((cred) => {
      return requirements.acceptedIssuers?.some(
        (issuer) => issuer.authPublicKey === cred.issuer_auth_public_key,
      );
    });

    const publicNotesFieldFilters = requirements.publicNotesFieldFilters;
    if (publicNotesFieldFilters) {
      result = result.filter((credential) => {
        let publicNotes: Record<string, string>;
        try {
          publicNotes = JSON.parse(credential.public_notes);
        } catch (_) {
          throw new Error(`Credential ${credential.id} has non-JSON public notes".replace("{}`);
        }
        return (
          matchCriteria(publicNotes, publicNotesFieldFilters.pick) &&
          negate(() => matchCriteria(publicNotes, publicNotesFieldFilters.omit))
        );
      });
    }

    const privateFieldFilters = requirements.privateFieldFilters;
    if (privateFieldFilters) {
      result = await this.enclaveProvider.filterCredentials(result, privateFieldFilters);
    }

    return result;
  }

  async requestAccessGrant(
    credentialId: string,
    {
      consumerEncryptionPublicKey,
      consumerAuthPublicKey,
    }: { consumerEncryptionPublicKey: string; consumerAuthPublicKey: string },
  ): Promise<idOSCredential> {
    const credential = await getCredentialById(this.kwilClient, credentialId);
    const contentHash = await this.getCredentialContentSha256Hash(credentialId);

    invariant(credential, `"idOSCredential" with id ${credentialId} not found`);

    const plaintextContent = utf8Decode(
      await this.enclaveProvider.decrypt(
        base64Decode(credential.content),
        base64Decode(credential.encryptor_public_key),
      ),
    );

    await this.enclaveProvider.ready(this.user.id, this.user.recipient_encryption_public_key);

    const { content, encryptorPublicKey } = await this.enclaveProvider.encrypt(
      utf8Encode(plaintextContent),
      base64Decode(consumerEncryptionPublicKey),
    );

    const insertableCredential = {
      ...credential,
      ...(await buildInsertableIDOSCredential(
        credential.user_id,
        "",
        base64Encode(content),
        consumerAuthPublicKey,
        base64Encode(encryptorPublicKey),
      )),
      original_credential_id: credential.id,
      id: crypto.randomUUID(),
      grantee_wallet_identifier: consumerAuthPublicKey,
      locked_until: 0,
      content_hash: contentHash,
    };

    await this.shareCredential(insertableCredential);

    return insertableCredential;
  }
}

export type {
  DelegatedWriteGrant,
  idOSCredential,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
  EnclaveOptions,
  EnclaveProvider,
};

export { signNearMessage };

export function createIDOSClient(params: {
  nodeUrl: string;
  enclaveOptions: Omit<EnclaveOptions, "mode">;
}): idOSClientConfiguration {
  return new idOSClientConfiguration({
    nodeUrl: params.nodeUrl,
    enclaveOptions: params.enclaveOptions,
  });
}
