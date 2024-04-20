import { Wallet } from "@near-wallet-selector/core";
import { Signer } from "ethers";
import { Store } from "../../../idos-store";
import { assertNever } from "../types";
import { Auth } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import type { EvmGrantsOptions, NearGrantsOptions } from "./grants";
import { Grants, SignerType } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import verifiableCredentials from "./verifiable-credentials";
import { IframeEnclave } from "./enclave-providers";

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
    nearGrantsOptions
  }: InitParams & { kwilWrapper: KwilWrapper }) {
    if (!idOS.initializing) throw new Error("Usage: `idOS.init(options)`");

    this.store = new Store();
    this.kwilWrapper = kwilWrapper;
    this.auth = new Auth(this, this.store, this.kwilWrapper);
    this.enclave = new Enclave(
      this.store,
      new IframeEnclave({ container }),
      async () => (await this.auth.currentUser()).humanId
    );
    this.data = new Data(this.kwilWrapper, this.enclave);
    this.grants = new Grants(this.data, evmGrantsOptions, nearGrantsOptions);
  }

  static async init(params: InitParams): Promise<idOS> {
    this.initializing = true;

    const idos = new this({
      ...params,
      kwilWrapper: await KwilWrapper.init(params)
    });
    await idos.enclave.load();

    return idos;
  }

  async setSigner(type: "NEAR", signer: Wallet): Promise<void>;

  async setSigner(type: "EVM", signer: Signer): Promise<void>;

  async setSigner(type: SignerType, signer: Wallet | Signer): Promise<void> {
    if (type === "NEAR") {
      const { accountId } = await this.auth.setNearSigner(signer as Wallet);
      const publicKey = (await this.auth.currentUser()).publicKey;
      this.grants = await this.grants.connect({
        type,
        accountId,
        signer: signer as Wallet,
        publicKey: publicKey as string
      });
    } else if (type === "EVM") {
      await this.auth.setEvmSigner(signer as Signer);
      this.grants = await this.grants.connect({ type, signer: signer as Signer });
    } else {
      this.grants = assertNever(type, `Signer type "${type}" not recognized`);
    }
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
