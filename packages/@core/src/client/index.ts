import type { KwilSigner } from "@kwilteam/kwil-js";
import {
  type EnclaveOptions,
  type EnclaveProvider,
  IframeEnclave,
  type KwilActionClient,
  Store,
  type Wallet,
  createClientKwilSigner,
  createWebKwilClient,
  type idOSUser,
} from "../index";
import { getUserProfile, hasProfile } from "../kwil-actions";

type Properties<T> = {
  // biome-ignore lint/complexity/noBannedTypes: All functions are to be removed.
  [K in keyof T as Exclude<T[K], Function> extends never ? never : K]: T[K];
};

type idOSClient =
  | idOSClientConfiguration
  | idOSClientIdle
  | idOSClientWithUserSigner
  | idOSClientLoggedIn;

class idOSClientConfiguration {
  readonly state: "configuration";
  readonly chainId?: string;
  readonly nodeUrl: string;
  readonly enclaveOptions: Omit<EnclaveOptions, "mode">;

  constructor(
    chainId: string | undefined,
    nodeUrl: string,
    enclaveOptions: Omit<EnclaveOptions, "mode">,
  ) {
    this.state = "configuration";
    this.chainId = chainId;
    this.nodeUrl = nodeUrl;
    this.enclaveOptions = enclaveOptions;
  }
}

class idOSClientIdle {
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

    // cspell:disable-next-line
    // TODO(pkoch): Where should I set the mode?
    const enclaveProvider = new IframeEnclave({ ...params.enclaveOptions });
    await enclaveProvider.load();

    return new idOSClientIdle(store, kwilClient, enclaveProvider);
  }

  async addressHasProfile(userAddress: string): Promise<boolean> {
    return hasProfile(this.kwilClient, userAddress);
  }

  async withUserSigner(signer: Wallet): Promise<idOSClientWithUserSigner | idOSClientLoggedIn> {
    const [kwilSigner, walletIdentifier] = await createClientKwilSigner(
      this.store,
      this.kwilClient,
      signer,
    );
    this.kwilClient.setSigner(kwilSigner);

    const newIdos = new idOSClientWithUserSigner(this, signer, kwilSigner, walletIdentifier);

    if (!(await newIdos.hasProfile())) return newIdos;

    return newIdos.logIn();
  }
}

class idOSClientWithUserSigner implements Omit<Properties<idOSClientIdle>, "state"> {
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

  async hasProfile(): Promise<boolean> {
    return hasProfile(this.kwilClient, this.walletIdentifier);
  }

  async logIn(): Promise<idOSClientLoggedIn> {
    if (!(await this.hasProfile())) throw new Error("User does not have a profile");

    // cspell:disable-next-line
    // TODO(pkoch): ready the enclave
    return new idOSClientLoggedIn(this, await getUserProfile(this.kwilClient));
  }

  // cspell:disable-next-line
  // TODO(pkoch): add logout
}

class idOSClientLoggedIn implements Omit<Properties<idOSClientWithUserSigner>, "state"> {
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

  // cspell:disable-next-line
  // TODO(pkoch): add logout
}
