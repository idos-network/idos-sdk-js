import { Wallet } from "@near-wallet-selector/core";
import { Signer } from "ethers";
import { Store } from "../../../idos-store";
import { assertNever } from "../types";
import { Auth, AuthUser } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import type { EvmGrantsOptions, NearGrantsOptions } from "./grants";
import { Grants, SignerType } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import verifiableCredentials from "./verifiable-credentials";

interface InitParams {
  nodeUrl?: string;
  dbId?: string;
  container: string;
  evmGrantsOptions?: EvmGrantsOptions;
  nearGrantsOptions?: NearGrantsOptions;
}

export class idOS {
  static initializing = false;

  static near = Grants.near;
  static evm = Grants.evm;
  static kwil = KwilWrapper.defaults;

  static profileProviders = [import.meta.env.VITE_FRACTAL_ID_URL];

  static verifiableCredentials = verifiableCredentials;

  auth: Auth;
  data: Data;
  enclave: Enclave;
  kwilWrapper: KwilWrapper;
  grants: Grants;
  store: Store;

  private constructor({
    container,
    kwilWrapper,
    evmGrantsOptions,
    nearGrantsOptions,
  }: InitParams & { kwilWrapper: KwilWrapper }) {
    if (!idOS.initializing) throw new Error("Usage: `idOS.init(options)`");

    this.store = new Store();
    this.auth = new Auth(kwilWrapper, this.store);
    this.data = new Data(this);
    this.enclave = new Enclave(this, container, undefined);
    this.kwilWrapper = kwilWrapper;
    this.grants = new Grants(this, evmGrantsOptions, nearGrantsOptions);
  }

  static async init(params: InitParams): Promise<idOS> {
    idOS.initializing = true;

    const idos = new idOS({
      ...params,
      kwilWrapper: await KwilWrapper.init(params),
    });
    await idos.enclave.load();

    return idos;
  }

  async setSigner(type: "NEAR", signer: Wallet): Promise<AuthUser>;

  async setSigner(type: "EVM", signer: Signer): Promise<AuthUser>;

  async setSigner(type: SignerType, signer: Wallet | Signer): Promise<AuthUser> {
    if (type === "NEAR") {
      await this.auth.setNearSigner(signer as Wallet);
      const currentUser = await this.auth.currentUser();
      this.grants = await this.grants.connect({
        type,
        accountId: currentUser.address,
        signer: signer as Wallet,
        // biome-ignore lint/style/noNonNullAssertion: we put it there when we're using NEAR.
        publicKey: currentUser.publicKey!,
      });

      return currentUser;
    }

    if (type === "EVM") {
      await this.auth.setEvmSigner(signer as Signer);
      const currentUser = await this.auth.currentUser();
      this.grants = await this.grants.connect({ type, signer: signer as Signer });

      return currentUser;
    }

    return assertNever(type, `Signer type "${type}" not recognized`);
  }

  async hasProfile(address: string): Promise<boolean> {
    return this.kwilWrapper.hasProfile(address);
  }

  async reset({ enclave = false } = {}): Promise<void> {
    this.store.reset();
    if (enclave) await this.enclave.reset();
  }

  get nodeUrl(): string {
    return this.kwilWrapper.kwilProvider;
  }
}
