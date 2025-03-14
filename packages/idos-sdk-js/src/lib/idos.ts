import { Store } from "@idos-network/core";
import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";

import { Auth, type AuthUser } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { IframeEnclave } from "./enclave-providers";
import type { EnclaveOptions } from "./enclave-providers/types";
import { Grants } from "./grants";
import type idOSGrant from "./grants/grant";
import { KwilWrapper } from "./kwil-wrapper";
import verifiableCredentials from "./verifiable-credentials";

export type SignerType = "EVM" | "NEAR";

interface InitParams {
  nodeUrl?: string;
  dbId?: string;
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

  private constructor({
    enclaveOptions,
    kwilWrapper,
    dbId,
    nodeUrl,
  }: InitParams & { kwilWrapper: KwilWrapper }) {
    if (!idOS.initializing) throw new Error("Usage: `idOS.init(options)`");
    this.store = new Store();
    this.kwilWrapper = kwilWrapper;

    this.auth = new Auth(kwilWrapper, this.store);

    if (!enclaveOptions || !enclaveOptions.container)
      throw new Error("`enclaveOptions.container` must be provided");

    this.enclave = new Enclave(this.auth, new IframeEnclave(enclaveOptions));

    this.data = new Data(kwilWrapper, this.enclave);

    this.grants = new Grants({ dbId, nodeUrl, kwilWrapper: this.kwilWrapper });
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
    const recognizedTypes = ["NEAR", "EVM"];
    if (!recognizedTypes.includes(type)) throw new Error(`Signer type "${type}" not recognized`);

    type === "EVM" && (await this.auth.setEvmSigner(signer as Signer));
    type === "NEAR" && (await this.auth.setNearSigner(signer as Wallet));

    const currentUser = this.auth.currentUser;
    return currentUser;
  }

  async hasProfile(userAddress: string): Promise<boolean> {
    return this.kwilWrapper.hasProfile(userAddress);
  }

  async listGrantedGrants(
    page: number,
    size?: number,
  ): Promise<{ grants: idOSGrant[]; totalCount: number }> {
    return this.kwilWrapper.getGrantsGranted(page, size);
  }

  async reset({ enclave = false } = {}): Promise<void> {
    this.store.reset();
    idOS.initializing = false;
    if (enclave) await this.enclave.reset();
  }

  get nodeUrl(): string {
    return this.kwilWrapper.kwilProvider;
  }

  async backupPasswordOrSecret() {
    return this.enclave.backupPasswordOrSecret();
  }

  async discoverUserEncryptionPublicKey(userId: string) {
    return this.enclave.discoverUserEncryptionPublicKey(userId);
  }
}
