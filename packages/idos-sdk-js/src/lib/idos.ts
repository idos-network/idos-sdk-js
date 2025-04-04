import {
  CHAIN_TYPES,
  type ChainType,
  type EnclaveOptions,
  IframeEnclave,
  Store,
} from "@idos-network/core";
import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";

import { Auth, type AuthUser } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { Grants } from "./grants";
import { KwilWrapper } from "./kwil-wrapper";
import verifiableCredentials from "./verifiable-credentials";

interface InitParams {
  nodeUrl?: string;
  enclaveOptions: EnclaveOptions;
}

export class idOS {
  static initializing = false;
  static kwil = KwilWrapper.defaults;

  static verifiableCredentials = verifiableCredentials;

  auth: Auth;
  data: Data;
  enclave: Enclave;
  kwilWrapper: KwilWrapper;
  grants: Grants;
  store: Store;

  private constructor(
    auth: Auth,
    data: Data,
    enclave: Enclave,
    kwilWrapper: KwilWrapper,
    grants: Grants,
    store: Store,
  ) {
    if (!idOS.initializing) throw new Error("Usage: `idOS.init(options)`");

    this.auth = auth;
    this.data = data;
    this.enclave = enclave;
    this.kwilWrapper = kwilWrapper;
    this.grants = grants;
    this.store = store;
  }

  static async init({ enclaveOptions, nodeUrl }: InitParams): Promise<idOS> {
    const enclave = new Enclave(new IframeEnclave(enclaveOptions));
    const store = new Store(window.localStorage);
    const kwilWrapper = await KwilWrapper.init({ nodeUrl });
    const auth = new Auth(kwilWrapper, store);
    const data = new Data(kwilWrapper, enclave, auth);
    const grants = new Grants({ kwilWrapper });

    idOS.initializing = true;
    const idos = new idOS(auth, data, enclave, kwilWrapper, grants, store);

    await idos.enclave.enclaveProvider.load();

    return idos;
  }

  async setSigner(type: "NEAR", signer: Wallet): Promise<AuthUser>;

  async setSigner(type: "EVM", signer: Signer): Promise<AuthUser>;

  async setSigner(type: ChainType, signer: Wallet | Signer): Promise<AuthUser> {
    if (!CHAIN_TYPES.includes(type)) throw new Error(`Signer type "${type}" not recognized`);

    type === "EVM" && (await this.auth.setEvmSigner(signer as Signer));
    type === "NEAR" && (await this.auth.setNearSigner(signer as Wallet));

    const currentUser = this.auth.currentUser;
    return currentUser;
  }

  async hasProfile(userAddress: string): Promise<boolean> {
    return this.kwilWrapper.hasProfile(userAddress);
  }

  async reset({ enclave = false } = {}): Promise<void> {
    this.store.reset();
    idOS.initializing = false;
    if (enclave) await this.enclave.enclaveProvider.reset();
  }
}
