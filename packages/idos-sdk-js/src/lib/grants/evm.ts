import type { Contract, Signer, TransactionResponse, ethers as ethersT } from "ethers";
import Grant from "./grant";
import type { GrantChild } from "./grant-child";

// Inlined from Ethers to make it easier to make the package optional.
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_DATA_ID = "0";
const ZERO_TIMELOCK = 0;

export interface EvmGrantsOptions {
  contractAddress?: string;
  chainId?: string;
}

export class EvmGrants implements GrantChild {
  static #defaultContractAddress = import.meta.env.VITE_IDOS_EVM_DEFAULT_CONTRACT_ADDRESS;
  static defaultChainId = import.meta.env.VITE_IDOS_EVM_DEFAULT_CHAIN_ID;

  static #abi = [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          indexed: true,
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
      ],
      name: "GrantAdded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          indexed: true,
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
      ],
      name: "GrantDeleted",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
      ],
      name: "deleteGrant",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
      ],
      name: "deleteGrantBySignature",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
      ],
      name: "deleteGrantBySignatureMessage",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "pure",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
      ],
      name: "findGrants",
      outputs: [
        {
          components: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
            {
              internalType: "address",
              name: "grantee",
              type: "address",
            },
            {
              internalType: "string",
              name: "dataId",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "lockedUntil",
              type: "uint256",
            },
          ],
          internalType: "struct AccessGrants.Grant[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
      ],
      name: "grantsFor",
      outputs: [
        {
          components: [
            {
              internalType: "address",
              name: "owner",
              type: "address",
            },
            {
              internalType: "address",
              name: "grantee",
              type: "address",
            },
            {
              internalType: "string",
              name: "dataId",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "lockedUntil",
              type: "uint256",
            },
          ],
          internalType: "struct AccessGrants.Grant[]",
          name: "",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
      ],
      name: "insertGrant",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes",
        },
      ],
      name: "insertGrantBySignature",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address",
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string",
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256",
        },
      ],
      name: "insertGrantBySignatureMessage",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "pure",
      type: "function",
    },
  ] as const;

  signer: Signer;
  #contract: Contract;

  private constructor(signer: Signer, contract: Contract) {
    this.signer = signer;
    this.#contract = contract;
  }

  static async init({
    signer,
    options,
  }: { signer: Signer; options: EvmGrantsOptions }): Promise<EvmGrants> {
    let ethers: typeof ethersT;
    try {
      ethers = await import("ethers");
    } catch (cause) {
      throw new Error("Can't load ethers", { cause });
    }

    return new EvmGrants(
      signer,
      new ethers.Contract(
        options.contractAddress ?? EvmGrants.#defaultContractAddress,
        EvmGrants.#abi,
        signer,
      ),
    );
  }

  #grantPromise(grant: Grant, wait = true) {
    return async (transaction: TransactionResponse) => {
      // biome-ignore lint/style/noNonNullAssertion: `transaction.wait()` only returns null when given `confirms = 0`.
      const transactionOrReceipt = wait ? (await transaction.wait())! : transaction;
      const transactionId = transactionOrReceipt.hash;

      return { grant, transactionId };
    };
  }

  async list({
    ownerAddress = ZERO_ADDRESS,
    granteeAddress = ZERO_ADDRESS,
    dataId = ZERO_DATA_ID,
  }: Partial<Omit<Grant, "lockedUntil">> = {}): Promise<Grant[]> {
    if (ownerAddress === ZERO_ADDRESS && granteeAddress === ZERO_ADDRESS)
      throw new Error("Must provide `owner` and/or `grantee`");

    const grants = await this.#contract.findGrants(ownerAddress, granteeAddress, dataId);

    return grants.map(
      ([ownerAddress, granteeAddress, dataId, lockedUntil]: [string, string, string, bigint]) =>
        new Grant({
          ownerAddress,
          granteeAddress,
          dataId,
          lockedUntil: Number(lockedUntil),
        }),
    );
  }

  async create({
    granteeAddress = ZERO_ADDRESS,
    dataId = ZERO_DATA_ID,
    lockedUntil = ZERO_TIMELOCK,
    wait = true,
  }: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    if (granteeAddress === ZERO_ADDRESS || dataId === ZERO_DATA_ID) {
      throw new Error("Must provide `grantee` and `dataId`");
    }

    const ownerAddress = await this.signer.getAddress();
    const grant: Grant = {
      ownerAddress,
      granteeAddress,
      dataId,
      lockedUntil,
    };

    let transaction: TransactionResponse;
    try {
      transaction = (await this.#contract.insertGrant(
        granteeAddress,
        dataId,
        lockedUntil,
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant creation failed", { cause: (e as Error).cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }

  async messageForCreateBySignature({
    ownerAddress,
    granteeAddress,
    dataId,
    lockedUntil,
  }: Grant): Promise<string> {
    return await this.#contract.insertGrantBySignatureMessage(
      ownerAddress,
      granteeAddress,
      dataId,
      lockedUntil,
    );
  }

  async createBySignature({
    ownerAddress,
    granteeAddress,
    dataId,
    lockedUntil,
    signature,
    wait,
  }: Grant & { signature: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    const grant: Grant = { ownerAddress, granteeAddress, dataId, lockedUntil };

    let transaction: TransactionResponse;
    try {
      transaction = (await this.#contract.insertGrantBySignature(
        ownerAddress,
        granteeAddress,
        dataId,
        lockedUntil,
        signature,
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant creation by signature failed", { cause: (e as Error).cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }

  async revoke({
    granteeAddress = ZERO_ADDRESS,
    dataId = ZERO_DATA_ID,
    lockedUntil = ZERO_TIMELOCK,
    wait = true,
  }: Omit<Grant, "ownerAddress"> & { wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    if (granteeAddress === ZERO_ADDRESS || dataId === ZERO_DATA_ID) {
      throw new Error("Must provide `grantee` and `dataId`");
    }

    const ownerAddress = await this.signer.getAddress();
    const grant: Grant = { ownerAddress, granteeAddress, dataId, lockedUntil };

    let transaction: TransactionResponse;
    try {
      transaction = (await this.#contract.deleteGrant(
        granteeAddress,
        dataId,
        lockedUntil,
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant revocation failed", { cause: (e as Error).cause });
    }

    return await this.#grantPromise(grant, wait)(transaction);
  }

  async messageForRevokeBySignature({
    ownerAddress,
    granteeAddress,
    dataId,
    lockedUntil,
  }: Grant): Promise<string> {
    return await this.#contract.deleteGrantBySignatureMessage(
      ownerAddress,
      granteeAddress,
      dataId,
      lockedUntil,
    );
  }

  async revokeBySignature({
    ownerAddress,
    granteeAddress,
    dataId,
    lockedUntil,
    signature,
    wait,
  }: Grant & { signature: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    const grant: Grant = { ownerAddress, granteeAddress, dataId, lockedUntil };

    let transaction: TransactionResponse;
    try {
      transaction = (await this.#contract.deleteGrantBySignature(
        ownerAddress,
        granteeAddress,
        dataId,
        lockedUntil,
        signature,
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant revocation by signature failed", { cause: (e as Error).cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }
}
