import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers-v6";
import { Store } from "../../../idos-store";
import { Auth, type AuthUser } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { IframeEnclave } from "./enclave-providers";
import type { EnclaveOptions } from "./enclave-providers/types";
import type { EvmGrantsOptions, NearGrantsOptions } from "./grants";
import { Grants, type SignerType } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import { Lit } from "./lit.ts";
import { assertNever, eventSetup } from "./utils";
import verifiableCredentials from "./verifiable-credentials";

interface InitParams {
  nodeUrl?: string;
  dbId?: string;
  /* @deprecated in favor of enclaveOptions */
  container?: string;
  enclaveOptions?: EnclaveOptions;
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
  lit: Lit;
  enclave: Enclave;
  kwilWrapper: KwilWrapper;
  grants: Grants;
  store: Store;

  private constructor({
    container,
    enclaveOptions,
    kwilWrapper,
    evmGrantsOptions,
    nearGrantsOptions,
  }: InitParams & { kwilWrapper: KwilWrapper }) {
    if (!idOS.initializing) throw new Error("Usage: `idOS.init(options)`");
    this.store = new Store();
    this.kwilWrapper = kwilWrapper;

    this.auth = new Auth(kwilWrapper, this.store);

    if (!enclaveOptions && !container)
      throw new Error("Either `container` or `enclaveOptions` must be provided");

    this.enclave = new Enclave(
      this.auth,
      // biome-ignore lint/style/noNonNullAssertion: TBD.
      new IframeEnclave(enclaveOptions ?? { container: container! }),
    );

    this.data = new Data(kwilWrapper, this.enclave);

    this.grants = new Grants(this.data, this.enclave, evmGrantsOptions, nearGrantsOptions);
    this.lit = new Lit("ethereum", this.store, this.data, this.enclave);

    this.lit.addLitEventsListeners();
  }

  async updateStore(key: string, value: unknown) {
    this.enclave.updateStore(key, value);
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
      const currentUser = this.auth.currentUser;
      this.grants = await this.grants.connect({
        type,
        accountId: currentUser.address,
        signer: signer as Wallet,
        // biome-ignore lint/style/noNonNullAssertion: we put it there when we're using NEAR.
        publicKey: currentUser.publicKey!,
      });
      eventSetup.trigger("signer-is-set");
      return currentUser;
    }

    if (type === "EVM") {
      await this.auth.setEvmSigner(signer as Signer);
      const currentUser = this.auth.currentUser;
      this.grants = await this.grants.connect({ type, signer: signer as Signer });
      eventSetup.trigger("signer-is-set");
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
