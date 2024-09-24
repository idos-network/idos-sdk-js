import type { Wallet } from "@near-wallet-selector/core";
import type { Signer } from "ethers";
import { differenceWith, isEqual } from "lodash-es";
import { Store } from "../../../idos-store";
import { Auth, type AuthUser } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { IframeEnclave } from "./enclave-providers";
import type { EnclaveOptions } from "./enclave-providers/types";
import type { EvmGrantsOptions, NearGrantsOptions } from "./grants";
import { Grants, type SignerType } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import type { StorableAttribute, idOSHumanAttribute } from "./types";
import { assertNever } from "./utils";
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
  }

  static async init(params: InitParams): Promise<idOS> {
    idOS.initializing = true;

    const idos = new idOS({
      ...params,
      kwilWrapper: await KwilWrapper.init(params),
    });
    await idos.enclave.load();

    (window as any).sdk = idos;

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

      return currentUser;
    }

    if (type === "EVM") {
      await this.auth.setEvmSigner(signer as Signer);
      const currentUser = this.auth.currentUser;
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

  filterLitAttributes(userAttrs: idOSHumanAttribute[], storableAttributes: StorableAttribute[]) {
    const hasLitKey = (attr: idOSHumanAttribute | StorableAttribute) =>
      "key" in attr ? attr.key.includes("lit-") : attr.attribute_key.includes("lit-");

    return {
      filteredUserAttributes: userAttrs.filter(hasLitKey),
      litSavableAttributes: storableAttributes.filter(hasLitKey),
    };
  }

  async updateAttributesIfNeeded(
    filteredUserAttributes: idOSHumanAttribute[],
    litSavableAttributes: StorableAttribute[],
  ) {
    const userAttrMap = new Map(filteredUserAttributes.map((attr) => [attr.attribute_key, attr]));
    const attributeToCreate: Omit<idOSHumanAttribute, "id" | "human_id">[] = [];

    const prepareValueSetter = (value: unknown): string =>
      Array.isArray(value) ? JSON.stringify(value) : typeof value === "string" ? value : "";

    const prepareValueGetter = (value: string): unknown => {
      try {
        if (JSON.parse(value)) return JSON.parse(value);
      } catch (error) {
        return value;
      }
    };

    for (const storableAttribute of litSavableAttributes) {
      const userAttr = userAttrMap.get(storableAttribute.key);
      const userAttributeValue = userAttr && prepareValueGetter(userAttr.value);

      if (userAttributeValue && userAttributeValue !== storableAttribute.value) {
        if (
          Array.isArray(userAttributeValue) &&
          !differenceWith(userAttributeValue, storableAttribute.value, isEqual).length
        )
          return;
        await this.data.update("attributes", { ...userAttr, value: storableAttribute.value });
      }

      if (!userAttr) {
        attributeToCreate.push({
          attribute_key: storableAttribute.key,
          value: prepareValueSetter(storableAttribute.value),
        });
      }
    }

    if (attributeToCreate.length) {
      console.log({ attributeToCreate });
      this.data.createMultiple("attributes", attributeToCreate);
    }
  }

  formStorableAttributes(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: string[],
  ): StorableAttribute[] {
    const dataArr = [ciphertext, dataToEncryptHash, accessControlConditions];
    const storableAttrs = ["lit-cipher-text", "lit-data-to-encrypt-hash", "lit-access-control"].map(
      (key, index) => {
        return { key, value: dataArr[index] };
      },
    );
    return storableAttrs;
  }

  async backupPasswordOrSecret() {
    return this.enclave.backupPasswordOrSecret(async (event) => {
      const {
        data: {
          payload: { accessControlConditions, passwordCiphers },
        },
      } = event;
      const { ciphertext, dataToEncryptHash } = passwordCiphers;

      const storableAttributes = this.formStorableAttributes(
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
      );
      const userAttrs: idOSHumanAttribute[] = (await this.data.list("attributes")) || [];

      const { filteredUserAttributes, litSavableAttributes } = this.filterLitAttributes(
        userAttrs,
        storableAttributes,
      );

      await this.updateAttributesIfNeeded(filteredUserAttributes, litSavableAttributes);
    });
  }
}
