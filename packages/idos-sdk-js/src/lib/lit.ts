import { LitNetwork } from "@lit-protocol/constants";
import type { EncryptResponse, SessionSigsMap } from "@lit-protocol/types"; // Import types explicitly
import type { Data } from "./data";
import type { Enclave } from "./enclave";

import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers-v6";

import {
  LitAbility,
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import type { Store } from "../../../idos-store";
import type { Attribute } from "./types";

const litAttributesLength = 3;

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
  chain: string;
  store;
  client: LitJsSdk.LitNodeClient | null = null;
  constructor(chain: string, store: Store) {
    this.chain = chain;
    this.store = store;
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
    let userAttributes = (await data.list("attributes")) as Attribute[];
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
