import type { idOSHumanAttribute } from "@idos-network/idos-sdk-types";
import type { Wallet } from "@near-wallet-selector/core";
import { isEqual } from "es-toolkit";
import type { Signer } from "ethers";
import { Store } from "../../../idos-store";
import { Auth, type AuthUser } from "./auth";
import { Data } from "./data";
import { Enclave } from "./enclave";
import { IframeEnclave } from "./enclave-providers";
import type { EnclaveOptions } from "./enclave-providers/types";
import type { EvmGrantsOptions, NearGrantsOptions } from "./grants";
import { Grants, type SignerType } from "./grants/grants";
import { KwilWrapper } from "./kwil-wrapper";
import type { StorableAttribute } from "./types";
import { assertNever } from "./utils";
import verifiableCredentials from "./verifiable-credentials";

interface InitParams {
  nodeUrl?: string;
  dbId?: string;
  enclaveOptions: EnclaveOptions;
  evmGrantsOptions?: EvmGrantsOptions;
  nearGrantsOptions?: NearGrantsOptions;
}

export class idOS {
  static initializing = false;

  static near = Grants.near;
  static evm = Grants.evm;
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
    evmGrantsOptions,
    nearGrantsOptions,
  }: InitParams & { kwilWrapper: KwilWrapper }) {
    if (!idOS.initializing) throw new Error("Usage: `idOS.init(options)`");
    this.store = new Store();
    this.kwilWrapper = kwilWrapper;

    this.auth = new Auth(kwilWrapper, this.store);

    if (!enclaveOptions || !enclaveOptions.container)
      throw new Error("`enclaveOptions.container` must be provided");

    this.enclave = new Enclave(this.auth, new IframeEnclave(enclaveOptions));

    this.data = new Data(kwilWrapper, this.enclave);

    this.grants = new Grants(this.data, this.enclave, evmGrantsOptions, nearGrantsOptions);
  }

  static async init(params: InitParams): Promise<idOS> {
    if (idOS.initializing) throw new Error("idOS instance already initialized.");
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
    idOS.initializing = false;
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
    filteredUserAttributes: idOSHumanAttribute[], // Arrays here are not safe (it's a string)
    litSavableAttributes: StorableAttribute[], // Arrays here are safe (it's a real array)
  ): Promise<void> {
    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
    return new Promise(async (res, rej) => {
      try {
        const userAttrMap = new Map(
          filteredUserAttributes.map((attr) => [attr.attribute_key, attr]),
        );
        const attributesToCreate: Omit<idOSHumanAttribute, "id" | "human_id">[] = [];

        // Helper function to safely parse JSON strings
        const safeParse = (text: string) => {
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        };

        // for a safe cooldown for consequent kwill update calls
        const wait = (
          ms = 1000, // TODO: find another way to handle sequential updating
        ) =>
          new Promise((res) =>
            setTimeout(() => {
              res(null);
            }, ms),
          );

        // Helper function to prepare a value for storage
        const prepareValueSetter = (value: unknown): string =>
          Array.isArray(value) ? JSON.stringify(value) : typeof value === "string" ? value : "";

        // Loop through savable attributes and handle updates/creation sequentially
        for (const storableAttribute of litSavableAttributes) {
          const userAttr = userAttrMap.get(storableAttribute.key);
          const userAttributeValue = userAttr ? safeParse(userAttr.value as string) : undefined;

          const needsUpdate =
            userAttributeValue && !isEqual(userAttributeValue, storableAttribute.value);

          if (userAttr) {
            if (needsUpdate) {
              const updatedValue = prepareValueSetter(storableAttribute.value);
              await this.data.update("attributes", { ...userAttr, value: updatedValue });
              await wait();
            }
          } else {
            // Prepare attributes to create if not found
            attributesToCreate.push({
              attribute_key: storableAttribute.key,
              value: prepareValueSetter(storableAttribute.value),
            });
          }
        }

        // Create new attributes if any are missing
        if (attributesToCreate.length)
          await this.data.createMultiple("attributes", attributesToCreate);

        res();
      } catch (error) {
        rej(error);
      }
    });
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

      const userAttrs = ((await this.data.list("attributes")) ||
        []) as unknown as idOSHumanAttribute[];

      const { filteredUserAttributes, litSavableAttributes } = this.filterLitAttributes(
        userAttrs,
        storableAttributes,
      );
      await this.updateAttributesIfNeeded(filteredUserAttributes, litSavableAttributes);
    });
  }

  async discoverEncryptionKey(humanId: string) {
    return this.enclave.discoverUserEncryptionKey(humanId);
  }
}
