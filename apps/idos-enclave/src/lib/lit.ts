import type { Store } from "@idos-network/idos-store";
import {
  LitAbility,
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { LitNetwork } from "@lit-protocol/constants";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import type { EncryptResponse, SessionSigsMap } from "@lit-protocol/types";
import { ethers } from "ethers";

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

interface AccessControlCondition {
  conditionType: string;
  returnValueTest: {
    value: string;
  };
}

export function getAllowedWalletAddresses(data: AccessControlCondition[]) {
  return data
    .filter((item) => item.conditionType === "evmBasic") // Filter only objects with conditionType "evmBasic"
    .map((item) => item.returnValueTest.value); // Extract the wallet addresses
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
  client: LitJsSdk.LitNodeClient = new LitJsSdk.LitNodeClient({
    alertWhenUnauthorized: false,
    litNetwork: LitNetwork.DatilDev,
    debug: true,
  });

  constructor(
    private readonly chain: string,
    private readonly store: Store,
  ) {}

  storeAccessControls = (userWallets: string[]) => {
    if (!userWallets.length) throw new Error("a valid user wallets array should be passed");
    const accessControls = createAccessControlCondition(userWallets);
    this.store.set("lit-access-control", accessControls);
  };

  getAccessControls = (walletAddresses?: string[]): string[] => {
    return (
      this.store.get("lit-access-control") || createAccessControlCondition(walletAddresses) || []
    );
  };

  async getSigner() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return signer;
  }

  async connect() {
    if (this.client.connectedNodes.size) return;
    await this.client.disconnect();
    await this.client.connect();
  }

  async encrypt(
    dataToEncrypt: string,
    walletAddresses: string[], // TODO: remove once find a way to pass wallets from sdk to enclave
  ): Promise<EncryptResponse | undefined> {
    try {
      await this.connect();
      const accessControlConditions = createAccessControlCondition(walletAddresses);
      this.storeAccessControls(walletAddresses);

      const response = await LitJsSdk.encryptString(
        { dataToEncrypt, accessControlConditions },
        this.client,
      );

      if (!response?.ciphertext) throw new Error("Error happened while encrypting data.");

      return response;
    } catch (error) {
      console.error(error);
    }
  }

  async getSessionSigs(): Promise<SessionSigsMap | undefined> {
    const signer = await this.getSigner();
    const address = await signer.getAddress();
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
          domain: window.location.host,
          statement: "Sign in with Lit Protocol",
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: address,
          nonce: await this.client.getLatestBlockhash(),
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

  async decrypt(ciphertext: string, dataToEncryptHash: string, accessControls?: unknown[]) {
    try {
      await this.connect();
      const accessControlConditions = accessControls || this.getAccessControls();
      const sessionSigs = await this.getSessionSigs();
      return LitJsSdk.decryptToString(
        {
          accessControlConditions,
          ciphertext,
          dataToEncryptHash,
          sessionSigs,
          chain: "ethereum",
        },
        this.client,
      );
    } catch (error) {
      console.log("error in decrypt");
      console.error(error);
    }
  }
}
