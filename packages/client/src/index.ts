import {
  buildInsertableIDOSCredential,
  matchLevelOrHigher,
  recordFilter,
} from "@idos-network/credentials/utils";
import type { BaseProvider, PublicEncryptionProfile } from "@idos-network/enclave";
import {
  createClientKwilSigner,
  createWebKwilClient,
  type KwilActionClient,
  signNearMessage,
  type Wallet,
} from "@idos-network/kwil-infra";
import {
  type AddAttributeInput,
  type AddWalletInput,
  addWallet,
  addWallets,
  addAttribute as createAttribute,
  createCredentialCopy,
  type DagMessageInput,
  dagMessage,
  dwgMessage,
  type GetAccessGrantsGrantedInput,
  type GetWalletsOutput,
  getAccessGrantsGrantedCount,
  getAccessGrantsOwned,
  getAttributes,
  getCredentialOwned,
  getCredentialShared,
  getCredentials,
  getGrants,
  getUser,
  getWallets,
  hasProfile,
  type idOSCredential,
  type idOSCredentialListItem,
  type idOSDelegatedWriteGrant,
  type idOSGrant,
  type idOSUser,
  type idOSUserAttribute,
  type idOSWallet,
  removeCredential,
  removeWallet,
  revokeAccessGrant,
  type ShareCredentialInput,
  shareCredential,
  type WalletType,
} from "@idos-network/kwil-infra/actions";
import type { KwilSigner } from "@idos-network/kwil-js";
import {
  base64Decode,
  base64Encode,
  hexEncode,
  hexEncodeSha256Hash,
  utf8Decode,
  utf8Encode,
} from "@idos-network/utils/codecs";
import { LocalStorageStore, type Store } from "@idos-network/utils/store";
import invariant from "tiny-invariant";

import { IframeEnclave } from "./enclave/iframe-enclave";
export { IframeEnclave };

type Properties<T> = {
  // biome-ignore lint/complexity/noBannedTypes: All functions are to be removed.
  [K in keyof T as Exclude<T[K], Function> extends never ? never : K]: T[K];
};

export type idOSClient =
  | idOSClientConfiguration
  | idOSClientIdle
  | idOSClientWithUserSigner
  | idOSClientLoggedIn;

export class idOSClientConfiguration<Provider extends BaseProvider = IframeEnclave> {
  readonly state: "configuration";
  readonly chainId?: string;
  readonly nodeUrl: string;
  readonly enclaveOptions: Omit<Provider["options"], "mode">;
  readonly store: Store;
  readonly enclaveProvider: BaseProvider;

  constructor(params: {
    chainId?: string;
    nodeUrl: string;
    enclaveOptions: Omit<Provider["options"], "mode">;
    enclaveProvider?: new (options: Omit<Provider["options"], "mode">) => Provider;
    store?: Store;
  }) {
    this.state = "configuration";
    this.chainId = params.chainId;
    this.nodeUrl = params.nodeUrl;
    this.enclaveOptions = params.enclaveOptions;
    this.store = params.store ?? new LocalStorageStore();

    // TODO: This is a mess because of types...
    if (params.enclaveProvider) {
      this.enclaveProvider = new params.enclaveProvider({
        ...params.enclaveOptions,
        // Some of enclave providers require store to be passed in constructor
        store: this.store,
      });
    } else {
      // @ts-expect-error - In case of missing "container" in options, enclave will blow up
      this.enclaveProvider = new IframeEnclave(params.enclaveOptions);
    }
  }

  async createClient(): Promise<idOSClientIdle> {
    return idOSClientIdle.fromConfig(this);
  }
}

export class idOSClientIdle {
  readonly state: "idle";
  readonly store: Store;
  readonly kwilClient: KwilActionClient;
  readonly enclaveProvider: BaseProvider;

  constructor(store: Store, kwilClient: KwilActionClient, enclaveProvider: BaseProvider) {
    this.state = "idle";
    this.store = store;
    this.kwilClient = kwilClient;
    this.enclaveProvider = enclaveProvider;
  }

  static async fromConfig(params: idOSClientConfiguration<BaseProvider>): Promise<idOSClientIdle> {
    const kwilClient = await createWebKwilClient({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    await params.enclaveProvider.load();

    return new idOSClientIdle(params.store, kwilClient, params.enclaveProvider);
  }

  async addressHasProfile(address: string): Promise<boolean> {
    return hasProfile(this.kwilClient, { address }).then((res) => res.has_profile);
  }

  async withUserSigner(_signer: Wallet): Promise<idOSClientWithUserSigner> {
    let signer = _signer;
    const [kwilSigner, walletIdentifier, walletPublicKey, walletType] =
      await createClientKwilSigner(this.store, this.kwilClient, signer);

    this.kwilClient.setSigner(kwilSigner);

    if (walletType === "NEAR") {
      const originalSigner = signer;
      signer = {
        signMessage: async (message: string) => {
          const signature = await signNearMessage(
            originalSigner as Parameters<typeof signNearMessage>[0],
            message,
          );
          return { signedMessage: signature } as { signedMessage: string };
        },
      } as unknown as Wallet;
    } else if (walletType === "Stellar") {
      const originalSigner = signer as Wallet & {
        signMessage: (message: string) => Promise<{ signedMessage: string }>;
      };
      signer = {
        // MPC engine expects Stellar signatures in hex form.
        signer: async (message: string) => {
          const result = await originalSigner.signMessage(message);
          let signatureBytes = base64Decode(result.signedMessage);

          // Some Stellar wallets return a base64-encoded string as bytes; normalize it.
          if (signatureBytes.length > 64) {
            const originalSignatureBytes = signatureBytes;
            const originalSignatureBytesLength = signatureBytes.length;
            try {
              signatureBytes = base64Decode(utf8Decode(signatureBytes));
            } catch (error) {
              // Keep initial decode if fallback fails.
              console.warn(
                "Fallback decode failed for signatureBytes: base64Decode(utf8Decode(signatureBytes)) failed. " +
                  `Original signatureBytes length: ${originalSignatureBytesLength}, ` +
                  `Original signatureBytes value: ${hexEncode(originalSignatureBytes)}, ` +
                  `Error: ${error instanceof Error ? error.message : String(error)}. ` +
                  "Using initial base64Decode result. This will be passed to hexEncode.",
              );
            }
          }

          return hexEncode(signatureBytes);
        },
      } as unknown as Wallet;
    }

    return new idOSClientWithUserSigner(
      this,
      signer,
      kwilSigner,
      walletIdentifier,
      walletPublicKey,
      walletType,
    );
  }

  async logOut(): Promise<idOSClientIdle> {
    return this;
  }
}

export class idOSClientWithUserSigner implements Omit<Properties<idOSClientIdle>, "state"> {
  readonly state: "with-user-signer";
  readonly store: Store;
  readonly kwilClient: KwilActionClient;
  readonly enclaveProvider: BaseProvider;
  readonly signer: Wallet;
  readonly kwilSigner: KwilSigner;
  readonly walletIdentifier: string;
  readonly walletPublicKey: string | undefined;
  readonly walletType: WalletType;

  constructor(
    idOSClientIdle: idOSClientIdle,
    signer: Wallet,
    kwilSigner: KwilSigner,
    walletIdentifier: string,
    walletPublicKey: string | undefined,
    walletType: WalletType,
  ) {
    this.state = "with-user-signer";
    this.store = idOSClientIdle.store;
    this.kwilClient = idOSClientIdle.kwilClient;
    this.enclaveProvider = idOSClientIdle.enclaveProvider;
    this.signer = signer;
    this.kwilSigner = kwilSigner;
    this.walletIdentifier = walletIdentifier;
    this.walletPublicKey = walletPublicKey;
    this.walletType = walletType;
    // @ts-expect-error - TODO: Fix this
    this.enclaveProvider.setSigner(this.signer);
  }

  async logOut(): Promise<idOSClientIdle> {
    this.kwilClient.setSigner(undefined);
    return new idOSClientIdle(this.store, this.kwilClient, this.enclaveProvider);
  }

  async hasProfile(): Promise<boolean> {
    return hasProfile(this.kwilClient, { address: this.walletIdentifier }).then(
      (x) => x.has_profile,
    );
  }

  async createUserEncryptionProfile(userId: string): Promise<PublicEncryptionProfile> {
    await this.enclaveProvider.reconfigure({
      mode: "new",
      userId,
      walletAddress: this.walletIdentifier,
      walletPublicKey: this.walletPublicKey,
      walletType: this.walletType,
      encryptionPasswordStore: undefined,
      expectedUserEncryptionPublicKey: undefined,
    });

    return this.enclaveProvider.ensureUserEncryptionProfile();
  }

  async logIn(): Promise<idOSClientLoggedIn> {
    if (!(await this.hasProfile())) throw new Error("User does not have a profile");

    const kwilUser = await getUser(this.kwilClient);

    await this.enclaveProvider.reconfigure({
      mode: "existing",
      userId: kwilUser.id,
      expectedUserEncryptionPublicKey: kwilUser.recipient_encryption_public_key,
      walletAddress: this.walletIdentifier,
      walletType: this.walletType,
      encryptionPasswordStore: kwilUser.encryption_password_store,
      walletPublicKey: this.walletPublicKey,
    });

    return new idOSClientLoggedIn(this, kwilUser);
  }
}

export class idOSClientLoggedIn implements Omit<Properties<idOSClientWithUserSigner>, "state"> {
  readonly state: "logged-in";
  readonly store: Store;
  readonly kwilClient: KwilActionClient;
  readonly enclaveProvider: BaseProvider;
  readonly signer: Wallet;
  readonly kwilSigner: KwilSigner;
  readonly walletIdentifier: string;
  readonly walletPublicKey: string | undefined;
  readonly walletType: WalletType;
  readonly user: idOSUser;

  constructor(idOSClientWithUserSigner: idOSClientWithUserSigner, user: idOSUser) {
    this.state = "logged-in";
    this.store = idOSClientWithUserSigner.store;
    this.kwilClient = idOSClientWithUserSigner.kwilClient;
    this.enclaveProvider = idOSClientWithUserSigner.enclaveProvider;
    this.signer = idOSClientWithUserSigner.signer;
    this.kwilSigner = idOSClientWithUserSigner.kwilSigner;
    this.walletIdentifier = idOSClientWithUserSigner.walletIdentifier;
    this.walletPublicKey = idOSClientWithUserSigner.walletPublicKey;
    this.walletType = idOSClientWithUserSigner.walletType;
    this.user = user;
  }

  async logOut(): Promise<idOSClientIdle> {
    this.kwilClient.setSigner(undefined);
    return new idOSClientIdle(this.store, this.kwilClient, this.enclaveProvider);
  }

  async requestDWGMessage(params: idOSDelegatedWriteGrant): Promise<string> {
    return dwgMessage(this.kwilClient, params).then((res) => res.message);
  }

  async removeCredential(id: string): Promise<{ id: string }> {
    await removeCredential(this.kwilClient, { id });
    return { id };
  }

  async getCredentialById(id: string): Promise<idOSCredential | undefined> {
    return getCredentialOwned(this.kwilClient, { id }).then((res) => res[0]);
  }

  async shareCredential(credential: ShareCredentialInput): Promise<ShareCredentialInput> {
    await shareCredential(this.kwilClient, credential);
    return credential;
  }

  async getAllCredentials(): Promise<idOSCredentialListItem[]> {
    return getCredentials(this.kwilClient);
  }

  async getAccessGrantsOwned(): Promise<idOSGrant[]> {
    return getAccessGrantsOwned(this.kwilClient);
  }

  async getAttributes(): Promise<idOSUserAttribute[]> {
    return getAttributes(this.kwilClient);
  }

  async createAttribute(attribute: AddAttributeInput): Promise<AddAttributeInput> {
    await createAttribute(this.kwilClient, attribute);
    return attribute;
  }

  async getCredentialContentSha256Hash(id: string): Promise<string> {
    const credential = await this.getCredentialById(id);

    invariant(credential, `"idOSCredential" with id ${id} not found`);

    await this.enclaveProvider.ensureUserEncryptionProfile();

    const plaintext = await this.enclaveProvider.decrypt(
      base64Decode(credential.content),
      base64Decode(credential.encryptor_public_key),
    );

    return hexEncodeSha256Hash(plaintext);
  }

  async getCredentialContent(id: string): Promise<string> {
    const credential = await this.getCredentialById(id);

    invariant(credential, `"idOSCredential" with id ${id} not found`);

    await this.enclaveProvider.ensureUserEncryptionProfile();

    const plaintext = await this.enclaveProvider.decrypt(
      base64Decode(credential.content),
      base64Decode(credential.encryptor_public_key),
    );

    return utf8Decode(plaintext);
  }

  async createCredentialCopy(
    id: string,
    consumerRecipientEncryptionPublicKey: string,
    consumerAddress: string,
    lockedUntil: number,
  ): Promise<{ id: string }> {
    const originalCredential = await this.getCredentialById(id);
    invariant(originalCredential, `"idOSCredential" with id ${id} not found`);

    await this.enclaveProvider.ensureUserEncryptionProfile();

    const decryptedContent = await this.enclaveProvider.decrypt(
      base64Decode(originalCredential.content),
      base64Decode(originalCredential.encryptor_public_key),
    );

    const { content, encryptorPublicKey } = await this.enclaveProvider.encrypt(
      decryptedContent,
      base64Decode(consumerRecipientEncryptionPublicKey),
    );

    const insertableCredential = {
      ...buildInsertableIDOSCredential(
        originalCredential.user_id,
        "",
        base64Encode(content),
        base64Encode(encryptorPublicKey),
      ),
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

  async requestDAGMessage(params: DagMessageInput): Promise<string> {
    return dagMessage(this.kwilClient, params).then((res) => res.message);
  }

  async getGrants(
    params: Partial<GetAccessGrantsGrantedInput>,
  ): Promise<{ grants: idOSGrant[]; totalCount: number }> {
    return {
      grants: await getGrants(this.kwilClient, params),
      totalCount: await this.getGrantsCount(),
    };
  }

  async addWallets(params: AddWalletInput[]): Promise<AddWalletInput[]> {
    await addWallets(this.kwilClient, params);
    return params;
  }

  async getGrantsCount(): Promise<number> {
    return getAccessGrantsGrantedCount(this.kwilClient, {
      user_id: null,
    }).then((res) => res.count);
  }

  async getCredentialShared(id: string): Promise<idOSCredential | undefined> {
    return getCredentialShared(this.kwilClient, { id }).then((res) => res[0]);
  }

  async revokeAccessGrant(id: string): Promise<{ id: string }> {
    await revokeAccessGrant(this.kwilClient, { id });
    return { id };
  }

  async addWallet(params: AddWalletInput): Promise<AddWalletInput> {
    await addWallet(this.kwilClient, params);

    // we don't need to add the wallet to MPC if the user is not using MPC
    if (this.user.encryption_password_store !== "mpc") {
      console.log("MPC is not enabled or the user is not using MPC");
      return params;
    }

    if (!params.wallet_type) {
      throw new Error("Wallet type is required for MPC users");
    }

    const messageToSign = await this.enclaveProvider.addAddressMessageToSign(
      params.address,
      params.public_key ?? undefined,
      params.wallet_type,
    );

    const signature = await this.enclaveProvider.signTypedData(
      messageToSign.domain,
      messageToSign.types,
      messageToSign.value,
    );

    const result = await this.enclaveProvider.addAddressToMpcSecret(
      this.user.id,
      messageToSign.value,
      signature,
    );

    if (result !== "success") {
      console.error(`Failed to add wallet to MPC: ${result}`);
    }

    return params;
  }

  async getWallets(): Promise<GetWalletsOutput[]> {
    return getWallets(this.kwilClient);
  }

  async removeWallet(id: string): Promise<{ id: string }> {
    const wallets = await this.getWallets();
    const wallet = wallets.find((wallet) => wallet.id === id);
    if (!wallet) {
      throw new Error(`Wallet with id ${id} not found`);
    }

    await removeWallet(this.kwilClient, { id });

    // we don't need to add the wallet to MPC if the user is not using MPC
    if (this.user.encryption_password_store !== "mpc") {
      console.log("MPC is not enabled or the user is not using MPC");
      return { id };
    }

    const messageToSign = await this.enclaveProvider.removeAddressMessageToSign(
      wallet.address,
      wallet.public_key ?? undefined,
      wallet.wallet_type,
    );
    const signature = await this.enclaveProvider.signTypedData(
      messageToSign.domain,
      messageToSign.types,
      messageToSign.value,
    );
    const result = await this.enclaveProvider.removeAddressFromMpcSecret(
      wallet.user_id,
      messageToSign.value,
      signature,
    );
    if (result !== "success") {
      console.error(`Failed to remove wallet from MPC: ${result}`);
    }

    return { id };
  }

  async removeWallets(ids: string[]): Promise<string[]> {
    for (const id of ids) {
      await this.removeWallet(id);
    }

    return ids;
  }

  async filterCredentials(requirements: {
    acceptedIssuers: {
      authPublicKey: string;
    }[];
    publicNotesFieldFilters?: {
      pick: Parameters<typeof recordFilter>[1];
      omit: Parameters<typeof recordFilter>[2];
    };
    privateFieldFilters?: {
      pick: Parameters<typeof recordFilter>[1];
      omit: Parameters<typeof recordFilter>[2];
    };
    credentialLevelOrHigherFilter?: {
      userLevel: "basic" | "plus";
      requiredAddons: ("liveness" | "email" | "phoneNumber")[];
    };
  }): Promise<idOSCredentialListItem[]> {
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
    const credentialLevelOrHigherFilter = requirements.credentialLevelOrHigherFilter;
    const privateFieldFilters = requirements.privateFieldFilters;

    if (credentialLevelOrHigherFilter) {
      result = result.filter((credential) => {
        let publicNotes: Record<string, string>;

        try {
          publicNotes = JSON.parse(credential.public_notes);
        } catch (_) {
          throw new Error(`Credential ${credential.id} has non-JSON public notes.`);
        }

        return matchLevelOrHigher(
          credentialLevelOrHigherFilter.userLevel,
          credentialLevelOrHigherFilter.requiredAddons,
          publicNotes.level,
        );
      });
    }

    if (
      publicNotesFieldFilters &&
      (Object.keys(publicNotesFieldFilters.pick).length > 0 ||
        Object.keys(publicNotesFieldFilters.omit).length > 0)
    ) {
      result = result.filter((credential) => {
        let publicNotes: Record<string, string>;

        try {
          publicNotes = JSON.parse(credential.public_notes);
        } catch (_) {
          throw new Error(`Credential ${credential.id} has non-JSON public notes.`);
        }

        return recordFilter(
          publicNotes,
          publicNotesFieldFilters.pick,
          publicNotesFieldFilters.omit,
        );
      });
    }

    // Private field filtering requires decryption and the full idOS credential content
    // it's most "expensive", since it requires a roundtrip to the nodes and roundtrip to enclave.
    if (
      privateFieldFilters &&
      (Object.keys(privateFieldFilters.pick).length > 0 ||
        Object.keys(privateFieldFilters.omit).length > 0)
    ) {
      const fullCredentials = await Promise.all(
        result.map((credential) => this.getCredentialById(credential.id)),
      );

      // Check for undefined, it will be sign of some internal error
      invariant(
        fullCredentials.every((cred) => cred !== undefined),
        "Some credentials could not be fetched in full form for private field filtering",
      );

      const matches = await this.enclaveProvider.filterCredentials(
        fullCredentials,
        privateFieldFilters,
      );

      result = result.filter((credential) =>
        matches.some((matchedCredential) => matchedCredential.id === credential.id),
      );
    }

    return result;
  }

  async requestAccessGrant(
    credentialId: string,
    {
      consumerEncryptionPublicKey,
      consumerAuthPublicKey,
      lockedUntil = 0,
    }: {
      consumerEncryptionPublicKey: string;
      consumerAuthPublicKey: string;
      lockedUntil?: number;
    },
  ): Promise<ShareCredentialInput> {
    const credential = await this.getCredentialById(credentialId);
    const contentHash = await this.getCredentialContentSha256Hash(credentialId);

    invariant(credential, `"idOSCredential" with id ${credentialId} not found`);

    const plaintextContent = utf8Decode(
      await this.enclaveProvider.decrypt(
        base64Decode(credential.content),
        base64Decode(credential.encryptor_public_key),
      ),
    );

    await this.enclaveProvider.ensureUserEncryptionProfile();

    const { content, encryptorPublicKey } = await this.enclaveProvider.encrypt(
      utf8Encode(plaintextContent),
      base64Decode(consumerEncryptionPublicKey),
    );

    const insertableCredential: ShareCredentialInput = {
      ...credential,
      ...buildInsertableIDOSCredential(
        credential.user_id,
        "",
        base64Encode(content),
        base64Encode(encryptorPublicKey),
      ),
      original_credential_id: credential.id,
      id: crypto.randomUUID(),
      grantee_wallet_identifier: consumerAuthPublicKey,
      locked_until: lockedUntil,
      content_hash: contentHash,
    };

    await this.shareCredential(insertableCredential);

    return insertableCredential;
  }
}

export type {
  idOSDelegatedWriteGrant,
  idOSCredential,
  idOSCredentialListItem,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
};

export { signNearMessage };

export function createIDOSClient(params: {
  nodeUrl: string;
  enclaveOptions: Omit<IframeEnclave["options"], "mode">;
}): idOSClientConfiguration<IframeEnclave> {
  return new idOSClientConfiguration({
    nodeUrl: params.nodeUrl,
    enclaveOptions: params.enclaveOptions,
  });
}
