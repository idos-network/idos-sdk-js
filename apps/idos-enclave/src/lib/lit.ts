type StorableAttribute = {
  key: string;
  value: string;
};

type UserWallet = {
  address: string;
};

import type { Store } from "@idos-network/idos-store";
import type { EncryptResponse, SessionSigsMap } from "@lit-protocol/types"; // Import types explicitly
import type { Data } from "../../../../packages/idos-sdk-js/src/lib/data";
import type { Enclave } from "../../../../packages/idos-sdk-js/src/lib/enclave";
import type { IdOSAttribute } from "./../../../../packages/idos-sdk-js/src/lib/types/index";

import { LitNetwork } from "@lit-protocol/constants";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";

import {
  LitAbility,
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

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

  async getSigner() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    return signer;
  }

  async connect() {
    if (this.client?.connectedNodes.size) return;
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
    walletAddresses = ["0xeDC73bFC1c4E748b58ea12e7AB920dc4FccE0A42"], // TODO: remove once find a way to pass wallets from sdk to enclave
  ): Promise<EncryptResponse | undefined> {
    try {
      await this.connect();
      const accessControlConditions = createAccessControlCondition([
        "0xeDC73bFC1c4E748b58ea12e7AB920dc4FccE0A42",
      ]);
      this.storeAccessControls(walletAddresses);
      const response = await LitJsSdk.encryptString(
        { dataToEncrypt, accessControlConditions },
        // biome-ignore lint/style/noNonNullAssertion: TBD
        this.client!,
      );
      if (!response?.ciphertext) throw new Error("Error happened at string encryption");
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
      await this.connect();
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
