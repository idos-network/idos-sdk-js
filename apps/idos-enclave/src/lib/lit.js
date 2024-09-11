import { LitNetwork } from "@lit-protocol/constants";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";

import {
  LitAbility,
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

function insertBetween(arr, objToInsert) {
  return arr.reduce((acc, curr, index) => {
    acc.push(curr);

    if (index < arr.length - 1) {
      acc.push(objToInsert);
    }

    return acc;
  }, []);
}

const createAccessControlCondition = (walletAddresses = []) => {
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
  chain;
  client;
  constructor(chain, store) {
    this.chain = chain;
    this.store = store;
  }

  async getSigner() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return signer;
  }

  async connect() {
    const client = new LitJsSdk.LitNodeClient({
      alertWhenUnauthorized: false,
      litNetwork: LitNetwork.DatilDev,
      debug: true,
    });
    await client.disconnect();
    await client.connect();
    this.client = client;
    return client;
  }

  async encrypt(dataToEncrypt, walletAddresses = []) {
    try {
      const accessControlConditions = createAccessControlCondition(walletAddresses);
      const response = await LitJsSdk.encryptString(
        { dataToEncrypt, accessControlConditions },
        this.client,
      );
      return response;
    } catch (error) {
      console.error(error);
    }
  }

  async getSessionSigs() {
    const signer = await this.getSigner();
    const address = await signer.getAddress();
    const sessionSignatures = await this.client.getSessionSigs({
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

  async decrypt(ciphertext, dataToEncryptHash, walletAddresses = []) {
    const accessControlConditions = createAccessControlCondition(walletAddresses);
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
  }
}
