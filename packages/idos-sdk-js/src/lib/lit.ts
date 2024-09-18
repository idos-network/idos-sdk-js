import { LitNetwork } from "@lit-protocol/constants";
import type { EncryptResponse, SessionSigsMap } from "@lit-protocol/types"; // Import types explicitly
import type { Data } from "./data";
import type { Enclave } from "./enclave";

import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers-v6";
import { differenceWith, isEqual } from "lodash-es";

import {
  LitAbility,
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import type { Store } from "../../../idos-store";
import type { IdOSAttribute } from "./types";
import { eventSetup } from "./utils";

declare type StorableAttribute = {
  key: string;
  value: string;
};

const litAttributesLength = 3;

const hasLitKey = (attr: IdOSAttribute | StorableAttribute) => {
  if ("key" in attr) return attr.key.includes("lit-");

  return attr.attribute_key.includes("lit-");
};

const prepareValueSetter = (value: unknown): string =>
  Array.isArray(value) ? JSON.stringify(value) : typeof value === "string" ? value : "";

const prepareValueGetter = (value: string): unknown => {
  try {
    if (JSON.parse(value)) return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

declare type UserWallet = {
  address: string;
};

declare global {
  interface Window {
    ethereum: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}
function insertBetween<T, S>(arr: T[], objToInsert: S): (T | S)[] {
  return arr.reduce((acc: (T | S)[], curr: T, index: number) => {
    acc.push(curr);

    if (index < arr.length - 1) {
      acc.push(objToInsert);
    }

    return acc;
  }, []);
}

export const createAccessControlCondition = (walletAddresses: string[] = []) => {
  const seprator = { operator: "or" };

  const withoutOperators = walletAddresses.map((walletAddress) => ({
    conditionType: "evmBasic",
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: walletAddress,
    },
  }));
  if (walletAddresses.length === 1) return withoutOperators;
  return insertBetween(withoutOperators, seprator);
};

export class Lit {
  client: LitJsSdk.LitNodeClient | null = null;
  chain: string;
  store: Store;
  data: Data | null = null;
  enclave: Enclave | null = null;

  constructor(chain: string, store: Store, data?: Data, enclave?: Enclave) {
    this.chain = chain;
    this.store = store;

    this.data = data ?? null;
    this.enclave = enclave ?? null;
  }

  addLitEventsListeners() {
    const { data, enclave } = this;
    if (!data || !enclave) return;

    eventSetup.on("request-to-enclave", async (ev) => {
      const actionsRequireAuth = ["decrypt", "encrypt"];
      const requireAuth = actionsRequireAuth.some((key) => key in ev.detail.request);
      if (!requireAuth) return;
      this.checkLitAttributes();
    });

    eventSetup.on("signer-is-set", () => {
      Lit.updateEnclaveWallets(data, enclave);
      Lit.updateEnclaveLitVariables(data, enclave);
    });
  }
  async checkLitAttributes() {
    const { data, enclave } = this;
    if (!data || !enclave) return;

    const userAttrs: IdOSAttribute[] = (await data.list("attributes")) || [];
    const storableAttributes = (await enclave.getStorableAttributes()) || [];

    const filteredUserAttributes = userAttrs.filter(hasLitKey);
    const litSavableAttributes = storableAttributes.filter(hasLitKey);
    const userAttrMap = new Map(filteredUserAttributes.map((attr) => [attr.attribute_key, attr]));

    const attributeToCreate: Omit<IdOSAttribute, "id">[] = [];
    // Case 1: Update user attributes if re-encryption happened
    for (const storableAttribute of litSavableAttributes) {
      const userAttr = userAttrMap.get(storableAttribute.key);

      const userAttributeValue = userAttr && prepareValueGetter(userAttr.value);

      // Update if it exists and has a different value
      if (userAttributeValue && userAttributeValue !== storableAttribute.value) {
        // in case attribute value was an array. then it's stored as sinegle string in user attributes. so we compare between strings
        if (
          Array.isArray(userAttributeValue) &&
          !differenceWith(userAttributeValue, storableAttribute.value, isEqual).length
        )
          return;

        await data.update("attributes", { ...userAttr, value: storableAttribute.value });
      }

      // Create if the attribute doesn't exist in userAttrs
      if (!userAttr)
        attributeToCreate.push({
          attribute_key: storableAttribute.key,
          value: prepareValueSetter(storableAttribute.value),
        });
    }
    if (attributeToCreate.length) data.createMultiple("attributes", attributeToCreate);
  }

  storeAccessControls = (userWallets: string[]) => {
    if (!userWallets.length) throw new Error("a valid user wallets array should be passed");
    const accessControls = createAccessControlCondition(userWallets);
    this.store.set("lit-access-control", accessControls);
  };

  getAccessControls = (walletAddresses: string[]): string[] => {
    return (
      this.store.get("lit-access-control") || createAccessControlCondition(walletAddresses) || []
    );
  };

  static async updateEnclaveWallets(data: Data, enclave: Enclave) {
    const wallets: UserWallet[] = await data.list("wallets");
    const addresses = wallets.map((userWallet) => userWallet.address);

    if (!Array.isArray(addresses))
      throw new Error("error happened while constructing addresses array!");
    enclave.updateStore("new-user-wallets", addresses);
  }

  static async updateEnclaveLitVariables(data: Data, enclave: Enclave) {
    let userAttributes = (await data.list("attributes")) as IdOSAttribute[];
    userAttributes = userAttributes.filter((attr) => attr.attribute_key.includes("lit-"));
    if (userAttributes.length !== litAttributesLength) return;
    const prepareValueToStore = (value: string) => {
      try {
        if (JSON.parse(value)) return JSON.parse(value);
      } catch (error) {
        return value;
      }
    };
    // biome-ignore lint/complexity/noForEach: <explanation>
    userAttributes.forEach((attr) => {
      enclave.updateStore(attr.attribute_key, prepareValueToStore(attr.value));
    });
  }

  async getSigner() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return signer;
  }

  async connect() {
    const client: LitJsSdk.LitNodeClient = new LitJsSdk.LitNodeClient({
      alertWhenUnauthorized: false,
      litNetwork: LitNetwork.DatilDev,
      debug: true,
    });
    await client.disconnect();
    await client.connect();
    this.client = client;
    return client;
  }

  async encrypt(
    dataToEncrypt: string,
    walletAddresses: string[] = [],
  ): Promise<EncryptResponse | undefined> {
    try {
      const accessControlConditions = createAccessControlCondition(walletAddresses);
      this.storeAccessControls(walletAddresses);

      const response = await LitJsSdk.encryptString(
        { dataToEncrypt, accessControlConditions },
        // biome-ignore lint/style/noNonNullAssertion: TBD
        this.client!,
      );
      return response;
    } catch (error) {
      console.error(error);
    }
  }

  async getSessionSigs(): Promise<SessionSigsMap | undefined> {
    const signer = await this.getSigner();
    const address = await signer.getAddress();
    // biome-ignore lint/style/noNonNullAssertion: TBD
    const sessionSignatures = await this.client?.getSessionSigs({
      chain: this.chain,
      resourceAbilityRequests: [
        {
          resource: new LitAccessControlConditionResource("*"),
          ability: LitAbility.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
        const toSign = await createSiweMessage({
          uri,
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: address,
          // biome-ignore lint/style/noNonNullAssertion: TBD
          nonce: await this.client?.getLatestBlockhash()!,
          litNodeClient: this.client,
        });

        const authSig = await generateAuthSig({
          signer: signer,
          toSign,
        });
        return authSig;
      },
    });
    return sessionSignatures;
  }

  async decrypt(ciphertext: string, dataToEncryptHash: string, walletAddresses: string[] = []) {
    try {
      const accessControlConditions = this.getAccessControls(walletAddresses);
      const sessionSigs = await this.getSessionSigs();
      return LitJsSdk.decryptToString(
        {
          accessControlConditions,
          ciphertext,
          dataToEncryptHash,
          sessionSigs,
          chain: "ethereum",
        },
        // biome-ignore lint/style/noNonNullAssertion: TBD
        this.client!,
      );
    } catch (error) {
      console.log("error in decrypt");
      console.error(error);
    }
  }
}
