import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";
import { Store } from "../../../idos-store";
import type { Attribute } from "../lib/types";
import { Auth, type AuthUser } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { IframeEnclave } from "./enclave-providers";
import type { EnclaveOptions } from "./enclave-providers/types";
import type { EvmGrantsOptions, NearGrantsOptions } from "./grants";
import { Grants, type SignerType } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import { assertNever, eventSetup } from "./utils";
import verifiableCredentials from "./verifiable-credentials";

const hasLitKeyAndValue = (record: { key: string; value: string }) =>
  (record?.key as string).includes("lit-") && !!record.value;

const litAttributesLength = 2;

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

    eventSetup.on("request-to-enclave", async (ev) => {
      const actionsRequireAuth = ["decrypt", "encrypt"];
      const requireAuth = actionsRequireAuth.some((key) => key in ev.detail.request);
      if (!requireAuth) return;
      this.checkLitAttributes();
    });

    eventSetup.on("signer-is-set", () => {
      this.updateEnclaveWallets();
      this.updateEnclaveLitVariables();
    });

    this.grants = new Grants(this.data, this.enclave, evmGrantsOptions, nearGrantsOptions);
  }

  async updateEnclaveLitVariables() {
    let userAttributes = (await this.data.list("attributes")) as Attribute[];
    userAttributes = userAttributes.filter((attr) => attr.attribute_key.includes("lit-"));
    if (userAttributes.length !== litAttributesLength) return;
    userAttributes.forEach((attr) => {
      this.updateStore(attr.attribute_key, attr.value);
    });
  }

  async checkLitAttributes() {
    const userAttrs = (await this.data.list("attributes")) || [];
    const savableAttributes = (await this.enclave.getSavableAttributes()) || [];

    const filteredUserAttributes = userAttrs
      .map((attr) => ({ ...attr, key: attr.attribute_key }))
      .filter(hasLitKeyAndValue);

    const litSavableAttributes = savableAttributes.filter(hasLitKeyAndValue);

    // in case cipher text and hash were updated (re-encryption happened) => user attributes should be updated
    if (filteredUserAttributes.length === litSavableAttributes.length) {
      for (const savableAttribute of litSavableAttributes) {
        const userAttr = filteredUserAttributes.find(
          (attr) => attr.attribute_key === savableAttribute.key,
        );
        if (!userAttr) return;
        if (userAttr.value !== savableAttribute.value)
          await this.data.update("attributes", { ...userAttr, value: savableAttribute.value });
      }
      return;
    }

    // in case of no user attributes that include lit info (create user lit attributes)
    if (!filteredUserAttributes.length) {
      const attributesToSave = savableAttributes.map((attr) => {
        return {
          attribute_key: attr.key,
          value: attr.value,
        };
      });
      return this.data.createMultiple("attributes", attributesToSave);
    }
  }

  async updateStore(key: string, value: any) {
    this.enclave.updateStore(key, value);
  }

  async updateEnclaveWallets() {
    const wallets = await this.data.list("wallets");
    const addresses = wallets.map((userWallet) => (userWallet as { address: "" }).address);

    if (!Array.isArray(addresses))
      throw new Error("error happened while constructing addresses array!");
    this.updateStore("new-user-wallets", addresses);
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
