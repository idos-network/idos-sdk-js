import type {
  BaseProvider,
  EncryptionPasswordStore,
  PublicEncryptionProfile,
} from "@idos-network/enclave";

import {
  buildEphemeralSignedCredentialContentReference,
  buildPreliminaryIDOSCredential,
  mapPreliminaryToIDOSCredential,
  matchClaims,
  matchLevelOrHigher,
  type PreliminaryIDOSCredential,
  recordFilter,
  type BaseLevel,
  type Addon,
  type Claim,
  type ClaimRequirements,
  type Claims,
  type ClaimSource,
  type ClaimSources,
} from "@idos-network/credentials/utils";
import {
  createClientKwilSigner,
  createKgwAuthenticatedBlobGateway,
  createNodeKwilClient,
  createWebKwilClient,
  isMmTokenAuth,
  type KwilActionClient,
  mmTokenStorageId,
  signNearMessage,
  type Wallet,
} from "@idos-network/kwil-infra";
import {
  type AddAttributeInput,
  type AddWalletInput,
  type AddWalletMessageInput,
  addWallet,
  addWalletMessage as requestAddWalletMessage,
  addWallets,
  addAttribute as createAttribute,
  createPreliminaryCredential,
  type CreatePreliminaryCredentialInput,
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
  type DelegatedWriteGrantBaseParams,
  toDelegatedWriteGrantBaseParams,
  type idOSGrant,
  type idOSUser,
  type idOSUserAttribute,
  type idOSWallet,
  removeCredential,
  removeWallet,
  revokeAccessGrant,
  type SharePreliminaryCredentialInput,
  sharePreliminaryCredential,
  type WalletType,
} from "@idos-network/kwil-infra/actions";
import { NodeKwil, type KwilSigner } from "@idos-network/kwil-js";
import {
  BlobGateway,
  createBlobContentReference,
  createUkycContentReference,
  requireAccessTokenForUkycContent,
  resolveCredentialEncryptedContent,
} from "@idos-network/utils/blob-gateway";
import {
  base64Decode,
  base64Encode,
  hexEncodeSha256Hash,
  utf8Decode,
} from "@idos-network/utils/codecs";
import { LocalStorageStore, MemoryStore, type Store } from "@idos-network/utils/store";
import invariant from "tiny-invariant";

import { IframeEnclave } from "./enclave/iframe-enclave";
export { IframeEnclave };

type Properties<T> = {
  // oxlint-disable-next-line typescript/no-restricted-types -- All functions are to be removed.
  [K in keyof T as Exclude<T[K], Function> extends never ? never : K]: T[K];
};

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined";
}

function usesNodeKwil(kwilClient: KwilActionClient): boolean {
  return kwilClient.client instanceof NodeKwil;
}

function idleBlobGateway(url: string): BlobGateway {
  if (!isBrowserRuntime()) {
    return new BlobGateway({ url });
  }

  return new BlobGateway({
    url,
    // Browser blob reads need the KGW HttpOnly session cookie. That only works if the
    // blob gateway is covered by the cookie's Domain (typically same host as nodeUrl/KGW).
    fetchFn: (input, init) => fetch(input, { ...init, credentials: "include" }),
  });
}

function blobGatewayForSigner(idle: idOSClientIdle, kwilSigner: KwilSigner): BlobGateway {
  if (usesNodeKwil(idle.kwilClient)) {
    return createKgwAuthenticatedBlobGateway({
      url: idle.blobGateway.url,
      kwilClient: idle.kwilClient,
      signer: kwilSigner,
    });
  }

  return isMmTokenAuth(kwilSigner)
    ? idle.blobGateway.withAccessToken(kwilSigner.accessToken)
    : idle.blobGateway;
}

function ukycStorageIdForWallet(
  walletType: WalletType,
  kwilSigner: KwilSigner,
): string | undefined {
  if (walletType !== "MM") {
    return undefined;
  }
  return mmTokenStorageId(kwilSigner);
}

const STALE_CLIENT =
  "This idOS client is stale: another signer was set or it was logged out. Use the client returned by the latest `withUserSigner()`.";

// Wrappers from one idle client share its Kwil client and enclave. `rawOf` unwraps the
// guard below; `turns` keeps signer replacement and enclave reconfiguration from interleaving.
const rawOf = new WeakMap<KwilActionClient, KwilActionClient>();
const boundOf = new WeakMap<KwilActionClient, WeakMap<KwilSigner, KwilActionClient>>();
const rawEnclaveOf = new WeakMap<BaseProvider, BaseProvider>();
const boundEnclaveOf = new WeakMap<BaseProvider, WeakMap<KwilSigner, BaseProvider>>();
const turns = new WeakMap<KwilActionClient, Promise<void>>();
const resetPending = new WeakSet<KwilActionClient>();

function sharedKwilClient(kwilClient: KwilActionClient): KwilActionClient {
  return rawOf.get(kwilClient) ?? kwilClient;
}

function assertSigner(kwilClient: KwilActionClient, kwilSigner: KwilSigner): void {
  if (kwilClient.signer !== kwilSigner) throw new Error(STALE_CLIENT);
}

// shortcut: guards call/execute/waitForTx/setSigner only; wrap any new KwilActionClient method here.
function boundKwilClient(kwilClient: KwilActionClient, kwilSigner: KwilSigner): KwilActionClient {
  const raw = sharedKwilClient(kwilClient);
  const cached = kwilSigner ? boundOf.get(raw)?.get(kwilSigner) : undefined;
  if (cached) return cached;

  const guard = (): void => assertSigner(raw, kwilSigner);
  const bound = {
    get signer() {
      guard();
      return raw.signer;
    },
    get client() {
      guard();
      return raw.client;
    },
    call: async (...args: Parameters<KwilActionClient["call"]>) => {
      guard();
      return raw.call(...args);
    },
    execute: async (...args: Parameters<KwilActionClient["execute"]>) => {
      guard();
      return raw.execute(...args);
    },
    waitForTx: async (txHash: string) => {
      guard();
      return raw.waitForTx(txHash);
    },
    setSigner: (signer: KwilSigner | undefined) => {
      guard();
      raw.setSigner(signer);
    },
  } as KwilActionClient;

  rawOf.set(bound, raw);
  if (kwilSigner) {
    const bySigner = boundOf.get(raw) ?? new WeakMap<KwilSigner, KwilActionClient>();
    bySigner.set(kwilSigner, bound);
    boundOf.set(raw, bySigner);
  }
  return bound;
}

function sharedEnclave(enclave: BaseProvider): BaseProvider {
  return (enclave && rawEnclaveOf.get(enclave)) || enclave;
}

function boundEnclave(
  enclave: BaseProvider,
  kwilClient: KwilActionClient,
  kwilSigner: KwilSigner,
): BaseProvider {
  const raw = sharedEnclave(enclave);
  const cached = kwilSigner ? boundEnclaveOf.get(raw)?.get(kwilSigner) : undefined;
  if (cached) return cached;

  const bound = new Proxy(raw, {
    get(target, prop) {
      if (prop === "then" || typeof prop === "symbol") return undefined;
      const value = Reflect.get(target, prop, target);
      if (typeof value !== "function") {
        assertSigner(kwilClient, kwilSigner);
        return value;
      }
      return (...args: unknown[]) => {
        assertSigner(kwilClient, kwilSigner);
        return value.apply(target, args);
      };
    },
  }) as BaseProvider;

  rawEnclaveOf.set(bound, raw);
  if (kwilSigner) {
    const bySigner = boundEnclaveOf.get(raw) ?? new WeakMap<KwilSigner, BaseProvider>();
    bySigner.set(kwilSigner, bound);
    boundEnclaveOf.set(raw, bySigner);
  }
  return bound;
}

function exclusive<T>(kwilClient: KwilActionClient, run: () => Promise<T>): Promise<T> {
  const raw = sharedKwilClient(kwilClient);
  const previous = turns.get(raw) ?? Promise.resolve();
  const result = previous.then(run, run);
  turns.set(
    raw,
    result.then(
      () => undefined,
      () => undefined,
    ),
  );
  return result;
}

// `setSigner` is synchronous on the real clients. A rejected promise here is not awaited
// by `withUserSigner` or the enclave constructor, and Node can terminate on it.
function detachedSurface<T extends object>(): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      if (prop === "signer") return undefined;
      if (prop === "then" || typeof prop === "symbol") return undefined;
      if (prop === "client") throw new Error(STALE_CLIENT);
      if (prop === "setSigner") {
        return () => {
          throw new Error(STALE_CLIENT);
        };
      }
      return async () => {
        throw new Error(STALE_CLIENT);
      };
    },
  });
}

function staleIdle(store: Store, blobUrl: string): idOSClientIdle {
  return new idOSClientIdle(
    store,
    detachedSurface<KwilActionClient>(),
    detachedSurface<BaseProvider>(),
    idleBlobGateway(blobUrl),
  );
}

// A replaced signer keeps the session. The signer that actually logged out must finish
// `reset` on a later attempt; success is only returned once that reset completes.
function finishLogOut(
  store: Store,
  kwilClient: KwilActionClient,
  kwilSigner: KwilSigner,
  enclaveProvider: BaseProvider,
  blobUrl: string,
): Promise<idOSClientIdle> {
  const raw = sharedKwilClient(kwilClient);
  return exclusive(raw, async () => {
    const current = raw.signer;
    if (current !== undefined && current !== kwilSigner) return staleIdle(store, blobUrl);

    if (current === kwilSigner) {
      raw.setSigner(undefined);
      resetPending.add(raw);
    }

    if (resetPending.has(raw)) {
      await enclaveProvider.reset();
      resetPending.delete(raw);
    }

    // A signer installed while `reset` was in progress must not ride back on this idle client.
    if (raw.signer !== undefined && raw.signer !== kwilSigner) return staleIdle(store, blobUrl);

    return new idOSClientIdle(store, raw, enclaveProvider, idleBlobGateway(blobUrl));
  });
}

export type idOSClient =
  | idOSClientConfiguration
  | idOSClientIdle
  | idOSClientWithUserSigner
  | idOSClientLoggedIn;

export class idOSClientConfiguration<Provider extends BaseProvider = IframeEnclave> {
  readonly state: "configuration";
  readonly chainId?: string;
  readonly nodeUrl: string;
  readonly blobGatewayUrl?: string;
  readonly enclaveOptions: Omit<Provider["options"], "mode">;
  readonly store: Store;
  readonly enclaveProvider: BaseProvider;

  constructor(params: {
    chainId?: string;
    nodeUrl: string;
    /**
     * Optional blob gateway base URL. Defaults to `nodeUrl`.
     * In the browser this must share KGW's session-cookie Domain
     * (typically the same host), because reads use `credentials: "include"`.
     */
    blobGatewayUrl?: string;
    enclaveOptions: Omit<Provider["options"], "mode">;
    enclaveProvider?: new (options: Omit<Provider["options"], "mode">) => Provider;
    store?: Store;
  }) {
    this.state = "configuration";
    this.chainId = params.chainId;
    this.nodeUrl = params.nodeUrl;
    this.blobGatewayUrl = params.blobGatewayUrl;
    this.enclaveOptions = params.enclaveOptions;
    this.store = params.store ?? (isBrowserRuntime() ? new LocalStorageStore() : new MemoryStore());

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
  readonly blobGateway: BlobGateway;

  constructor(
    store: Store,
    kwilClient: KwilActionClient,
    enclaveProvider: BaseProvider,
    blobGateway: BlobGateway,
  ) {
    this.state = "idle";
    this.store = store;
    this.kwilClient = kwilClient;
    this.enclaveProvider = enclaveProvider;
    this.blobGateway = blobGateway;
  }

  static async fromConfig(params: idOSClientConfiguration<BaseProvider>): Promise<idOSClientIdle> {
    const createKwilClient = isBrowserRuntime() ? createWebKwilClient : createNodeKwilClient;
    const kwilClient = await createKwilClient({
      nodeUrl: params.nodeUrl,
      chainId: params.chainId,
    });

    await params.enclaveProvider.load();

    const blobGatewayUrl = params.blobGatewayUrl ?? params.nodeUrl;
    return new idOSClientIdle(
      params.store,
      kwilClient,
      params.enclaveProvider,
      idleBlobGateway(blobGatewayUrl),
    );
  }

  async addressHasProfile(address: string): Promise<boolean> {
    return hasProfile(this.kwilClient, { address }).then((res) => res.has_profile);
  }

  async withUserSigner(_signer: Wallet): Promise<idOSClientWithUserSigner> {
    let signer = _signer;
    const [kwilSigner, walletIdentifier, walletPublicKey, walletType] =
      await createClientKwilSigner(this.store, this.kwilClient, signer);

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
    }

    return exclusive(this.kwilClient, async () => {
      this.kwilClient.setSigner(kwilSigner);
      return new idOSClientWithUserSigner(
        this,
        signer,
        kwilSigner,
        walletIdentifier,
        walletPublicKey,
        walletType,
        blobGatewayForSigner(this, kwilSigner),
      );
    });
  }

  async logOut(): Promise<idOSClientIdle> {
    return this;
  }
}

export class idOSClientWithUserSigner implements Omit<Properties<idOSClientIdle>, "state"> {
  readonly state: "with-user-signer";
  readonly store: Store;
  readonly #kwilClient: KwilActionClient;
  readonly #enclaveProvider: BaseProvider;
  readonly signer: Wallet;
  readonly kwilSigner: KwilSigner;
  readonly walletIdentifier: string;
  readonly walletPublicKey: string | undefined;
  readonly walletType: WalletType;
  readonly blobGateway: BlobGateway;

  constructor(
    idOSClientIdle: idOSClientIdle,
    signer: Wallet,
    kwilSigner: KwilSigner,
    walletIdentifier: string,
    walletPublicKey: string | undefined,
    walletType: WalletType,
    blobGateway: BlobGateway,
  ) {
    this.state = "with-user-signer";
    this.store = idOSClientIdle.store;
    this.#kwilClient = idOSClientIdle.kwilClient;
    this.#enclaveProvider = idOSClientIdle.enclaveProvider;
    this.signer = signer;
    this.kwilSigner = kwilSigner;
    this.walletIdentifier = walletIdentifier;
    this.walletPublicKey = walletPublicKey;
    this.walletType = walletType;
    this.blobGateway = blobGateway;
    // @ts-expect-error - TODO: Fix this
    this.#enclaveProvider.setSigner(this.signer);
  }

  get kwilClient(): KwilActionClient {
    return boundKwilClient(this.#kwilClient, this.kwilSigner);
  }

  get enclaveProvider(): BaseProvider {
    return boundEnclave(this.#enclaveProvider, this.#kwilClient, this.kwilSigner);
  }

  async logOut(): Promise<idOSClientIdle> {
    return finishLogOut(
      this.store,
      this.#kwilClient,
      this.kwilSigner,
      this.#enclaveProvider,
      this.blobGateway.url,
    );
  }

  async hasProfile(): Promise<boolean> {
    // NEAR profiles are keyed by the ed25519 public key. walletIdentifier is the account id.
    let address = this.walletIdentifier;
    if (this.walletType === "NEAR") {
      if (!this.walletPublicKey) throw new Error("NEAR wallet public key is required");
      address = this.walletPublicKey;
    }
    return hasProfile(this.kwilClient, { address }).then((x) => x.has_profile);
  }

  async createUserEncryptionProfile(
    userId: string,
    forceEncryptionPasswordStore?: EncryptionPasswordStore,
  ): Promise<PublicEncryptionProfile> {
    await exclusive(this.#kwilClient, async () => {
      assertSigner(this.#kwilClient, this.kwilSigner);
      await this.enclaveProvider.reconfigure({
        mode: "new",
        userId,
        walletAddress: this.walletIdentifier,
        walletPublicKey: this.walletPublicKey,
        walletType: this.walletType,
        encryptionPasswordStore: forceEncryptionPasswordStore,
        expectedUserEncryptionPublicKey: undefined,
      });
      assertSigner(this.#kwilClient, this.kwilSigner);
    });
    assertSigner(this.#kwilClient, this.kwilSigner);
    return this.enclaveProvider.ensureUserEncryptionProfile();
  }

  async logIn(): Promise<idOSClientLoggedIn> {
    if (!(await this.hasProfile())) throw new Error("User does not have a profile");

    const kwilUser = await getUser(this.kwilClient);

    return exclusive(this.#kwilClient, async () => {
      assertSigner(this.#kwilClient, this.kwilSigner);
      await this.enclaveProvider.reconfigure({
        mode: "existing",
        userId: kwilUser.id,
        expectedUserEncryptionPublicKey: kwilUser.recipient_encryption_public_key,
        walletAddress: this.walletIdentifier,
        walletType: this.walletType,
        encryptionPasswordStore: kwilUser.encryption_password_store,
        walletPublicKey: this.walletPublicKey,
      });
      assertSigner(this.#kwilClient, this.kwilSigner);
      return new idOSClientLoggedIn(this, kwilUser);
    });
  }
}

export class idOSClientLoggedIn implements Omit<Properties<idOSClientWithUserSigner>, "state"> {
  readonly state: "logged-in";
  readonly store: Store;
  readonly #kwilClient: KwilActionClient;
  readonly #enclaveProvider: BaseProvider;
  readonly signer: Wallet;
  readonly kwilSigner: KwilSigner;
  readonly walletIdentifier: string;
  readonly walletPublicKey: string | undefined;
  readonly walletType: WalletType;
  readonly user: idOSUser;
  readonly blobGateway: BlobGateway;

  constructor(idOSClientWithUserSigner: idOSClientWithUserSigner, user: idOSUser) {
    this.state = "logged-in";
    this.store = idOSClientWithUserSigner.store;
    this.#kwilClient = sharedKwilClient(idOSClientWithUserSigner.kwilClient);
    this.#enclaveProvider = sharedEnclave(idOSClientWithUserSigner.enclaveProvider);
    this.signer = idOSClientWithUserSigner.signer;
    this.kwilSigner = idOSClientWithUserSigner.kwilSigner;
    this.walletIdentifier = idOSClientWithUserSigner.walletIdentifier;
    this.walletPublicKey = idOSClientWithUserSigner.walletPublicKey;
    this.walletType = idOSClientWithUserSigner.walletType;
    this.user = user;
    this.blobGateway = idOSClientWithUserSigner.blobGateway;
  }

  get kwilClient(): KwilActionClient {
    return boundKwilClient(this.#kwilClient, this.kwilSigner);
  }

  get enclaveProvider(): BaseProvider {
    return boundEnclave(this.#enclaveProvider, this.#kwilClient, this.kwilSigner);
  }

  async logOut(): Promise<idOSClientIdle> {
    return finishLogOut(
      this.store,
      this.#kwilClient,
      this.kwilSigner,
      this.#enclaveProvider,
      this.blobGateway.url,
    );
  }

  async requestDWGMessage(params: idOSDelegatedWriteGrant): Promise<string> {
    return dwgMessage(this.kwilClient, params).then((res) => res.message);
  }

  async createCredential(
    publicNotes: string,
    plaintextContent: Uint8Array<ArrayBufferLike>,
    // In case of credential creation on users behalf, this would be a issuer key
    issuerSigningSecretKey?: Uint8Array,
  ): Promise<Omit<idOSCredential, "user_id" | "content" | "inserter_type" | "inserter_id">> {
    const credentialId = crypto.randomUUID();
    const preliminaryCredential: PreliminaryIDOSCredential = {
      ...(await buildPreliminaryIDOSCredential({
        publicNotes,
        plaintextContent,
        recipientEncryptionPublicKey: base64Decode(this.user.recipient_encryption_public_key),
        issuerSigningSecretKey,
        ukycStorageId: ukycStorageIdForWallet(this.walletType, this.kwilSigner),
      })),
      id: credentialId,
    };
    requireAccessTokenForUkycContent(
      preliminaryCredential.contentUri,
      this.blobGateway.hasAccessToken,
    );

    const requestId = crypto.randomUUID();

    const payload: CreatePreliminaryCredentialInput = {
      request_id: requestId,
      credential_id: preliminaryCredential.id,
      issuer_auth_public_key: preliminaryCredential.issuerAuthPublicKey,
      encryptor_public_key: preliminaryCredential.encryptorPublicKey,
      content_uri: preliminaryCredential.contentUri,
      content_size: preliminaryCredential.contentSize,
      content_hash: hexEncodeSha256Hash(plaintextContent),
      public_notes: preliminaryCredential.publicNotes,
      public_notes_signature: preliminaryCredential.publicNotesSignature,
      broader_signature: preliminaryCredential.broaderSignature,
    };

    await createPreliminaryCredential(this.kwilClient, payload);

    await this.blobGateway.uploadCredentialBlobs({
      requestId,
      original: preliminaryCredential.encryptedContent,
    });

    return mapPreliminaryToIDOSCredential(preliminaryCredential);
  }

  async removeCredential(id: string): Promise<{ id: string }> {
    const credential = await this.getCredentialById(id);
    invariant(credential, `"idOSCredential" with id ${id} not found`);

    const contentUri = credential.content_uri ?? null;
    requireAccessTokenForUkycContent(contentUri, this.blobGateway.hasAccessToken);

    await removeCredential(this.kwilClient, { id });

    if (!contentUri) {
      return { id };
    }

    await this.blobGateway.deleteCredentialBlob({ credentialId: id });
    return { id };
  }

  async getCredentialById(id: string): Promise<idOSCredential | undefined> {
    return getCredentialOwned(this.kwilClient, { id }).then((res) => res[0]);
  }

  async shareCredential(
    credential: SharePreliminaryCredentialInput,
  ): Promise<SharePreliminaryCredentialInput> {
    await sharePreliminaryCredential(this.kwilClient, credential);
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
    const plaintext = await this.#decryptCredentialContent(credential);

    return hexEncodeSha256Hash(plaintext);
  }

  async getCredentialContent(id: string): Promise<string> {
    const credential = await this.getCredentialById(id);

    invariant(credential, `"idOSCredential" with id ${id} not found`);
    const plaintext = await this.#decryptCredentialContent(credential);

    return utf8Decode(plaintext);
  }

  async getCredentialWithEncryptedContent(id: string): Promise<idOSCredential> {
    const credential = await this.getCredentialById(id);
    invariant(credential, `"idOSCredential" with id ${id} not found`);
    return this.#credentialWithInlineContent(credential);
  }

  async getCredentialSharedContent(id: string): Promise<string> {
    const credential = await this.getCredentialShared(id);

    invariant(credential, `Shared credential with id ${id} not found`);
    const plaintext = await this.#decryptCredentialContent(credential);

    return utf8Decode(plaintext);
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

  async addWalletMessage(params: AddWalletMessageInput): Promise<string> {
    const result = await requestAddWalletMessage(this.kwilClient, params);
    return result.message;
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
      console.error(`Failed to add wallet to MPC: ${result}`);
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
    /** @deprecated The level leaves out self-attested data. Use `claimsFilter` instead. */
    credentialLevelOrHigherFilter?: {
      userLevel: BaseLevel;
      requiredAddons: Addon[];
    };
    /** Accepted sources per claim, e.g. `{ email: ["VERIFIED", "MANUAL"] }`. See `matchClaims`. */
    claimsFilter?: ClaimRequirements;
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
    const claimsFilter = requirements.claimsFilter;

    if (claimsFilter) {
      result = result.filter((credential) => {
        let publicNotes: Parameters<typeof matchClaims>[1];

        try {
          publicNotes = JSON.parse(credential.public_notes);
        } catch (_) {
          throw new Error(`Credential ${credential.id} has non-JSON public notes.`);
        }

        return matchClaims(claimsFilter, publicNotes);
      });
    }

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
        await Promise.all(
          fullCredentials.map((credential) => this.#credentialWithInlineContent(credential)),
        ),
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
  ): Promise<SharePreliminaryCredentialInput> {
    const credential = await this.getCredentialById(credentialId);

    invariant(credential, `"idOSCredential" with id ${credentialId} not found`);

    const plaintextContent = await this.#decryptCredentialContent(credential);
    const contentHash = hexEncodeSha256Hash(plaintextContent);

    await this.enclaveProvider.ensureUserEncryptionProfile();

    const { content, encryptorPublicKey } = await this.enclaveProvider.encrypt(
      plaintextContent,
      base64Decode(consumerEncryptionPublicKey),
    );

    // User issues the shared copy: sign content_uri with an ephemeral user-side key.
    // Copy issuer_auth_public_key need not match the original credential's issuer.
    const copyId = crypto.randomUUID();
    const ukycStorageId = ukycStorageIdForWallet(this.walletType, this.kwilSigner);
    const copyReference = ukycStorageId
      ? createUkycContentReference(ukycStorageId, content)
      : await createBlobContentReference(content);
    requireAccessTokenForUkycContent(copyReference.uri, this.blobGateway.hasAccessToken);
    const signedReference = buildEphemeralSignedCredentialContentReference("", copyReference.uri);

    // Integrator-supplied. ed25519 @caller is lowercase hex; after exact grantee
    // matching, uppercase hex would store a grant the consumer cannot read. Other
    // identifier encodings (NEAR, XRPL, Stellar, MM) are case-sensitive, so leave them.
    const granteeWalletIdentifier = /^[0-9a-fA-F]{64}$/.test(consumerAuthPublicKey)
      ? consumerAuthPublicKey.toLowerCase()
      : consumerAuthPublicKey;

    const preliminaryCredential: SharePreliminaryCredentialInput = {
      ...signedReference,
      request_id: crypto.randomUUID(),
      copy_id: copyId,
      original_id: credential.id,
      content_uri: copyReference.uri,
      content_size: copyReference.size,
      encryptor_public_key: base64Encode(encryptorPublicKey),
      grantee_wallet_identifier: granteeWalletIdentifier,
      locked_until: lockedUntil,
      content_hash: contentHash,
    };

    await this.shareCredential(preliminaryCredential);
    await this.blobGateway.uploadCredentialBlobs({
      requestId: preliminaryCredential.request_id,
      copy: content,
    });

    return preliminaryCredential;
  }

  async #credentialWithInlineContent(credential: idOSCredential): Promise<idOSCredential> {
    if (credential.content) {
      return credential;
    }

    return {
      ...credential,
      content: base64Encode(await this.#getCredentialEncryptedContent(credential)),
      content_uri: null,
      content_size: null,
    };
  }

  async #decryptCredentialContent(credential: idOSCredential): Promise<Uint8Array> {
    await this.enclaveProvider.ensureUserEncryptionProfile();

    return this.enclaveProvider.decrypt(
      await this.#getCredentialEncryptedContent(credential),
      base64Decode(credential.encryptor_public_key),
    );
  }

  async #getCredentialEncryptedContent(credential: idOSCredential): Promise<Uint8Array> {
    return resolveCredentialEncryptedContent(credential, this.blobGateway);
  }
}

export type {
  Claim,
  ClaimRequirements,
  Claims,
  ClaimSource,
  ClaimSources,
  idOSDelegatedWriteGrant,
  DelegatedWriteGrantBaseParams,
  idOSCredential,
  idOSCredentialListItem,
  idOSGrant,
  idOSUser,
  idOSUserAttribute,
  idOSWallet,
};

export { signNearMessage, toDelegatedWriteGrantBaseParams };

export function createIDOSClient(params: {
  nodeUrl: string;
  /**
   * Optional blob gateway base URL. Defaults to `nodeUrl`.
   * In the browser this must share KGW's session-cookie Domain
   * (typically the same host), because reads use `credentials: "include"`.
   */
  blobGatewayUrl?: string;
  enclaveOptions: Omit<IframeEnclave["options"], "mode">;
}): idOSClientConfiguration<IframeEnclave> {
  return new idOSClientConfiguration({
    nodeUrl: params.nodeUrl,
    blobGatewayUrl: params.blobGatewayUrl,
    enclaveOptions: params.enclaveOptions,
  });
}
