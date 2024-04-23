import { Contract, Signer, TransactionResponse, ZeroAddress } from "ethers";
import Grant from "./grant";
import { GrantChild } from "./grant-child";

const ZERO_ADDRESS = ZeroAddress;
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
      type: "constructor"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          indexed: true,
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          indexed: true,
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        }
      ],
      name: "GrantAdded",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          indexed: true,
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          indexed: true,
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        }
      ],
      name: "GrantDeleted",
      type: "event"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        }
      ],
      name: "deleteGrant",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes"
        }
      ],
      name: "deleteGrantBySignature",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        }
      ],
      name: "deleteGrantBySignatureMessage",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        }
      ],
      name: "findGrants",
      outputs: [
        {
          components: [
            {
              internalType: "address",
              name: "owner",
              type: "address"
            },
            {
              internalType: "address",
              name: "grantee",
              type: "address"
            },
            {
              internalType: "string",
              name: "dataId",
              type: "string"
            },
            {
              internalType: "uint256",
              name: "lockedUntil",
              type: "uint256"
            }
          ],
          internalType: "struct AccessGrants.Grant[]",
          name: "",
          type: "tuple[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        }
      ],
      name: "grantsFor",
      outputs: [
        {
          components: [
            {
              internalType: "address",
              name: "owner",
              type: "address"
            },
            {
              internalType: "address",
              name: "grantee",
              type: "address"
            },
            {
              internalType: "string",
              name: "dataId",
              type: "string"
            },
            {
              internalType: "uint256",
              name: "lockedUntil",
              type: "uint256"
            }
          ],
          internalType: "struct AccessGrants.Grant[]",
          name: "",
          type: "tuple[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        }
      ],
      name: "insertGrant",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes"
        }
      ],
      name: "insertGrantBySignature",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "address",
          name: "grantee",
          type: "address"
        },
        {
          internalType: "string",
          name: "dataId",
          type: "string"
        },
        {
          internalType: "uint256",
          name: "lockedUntil",
          type: "uint256"
        }
      ],
      name: "insertGrantBySignatureMessage",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      stateMutability: "pure",
      type: "function"
    }
  ] as const;

  signer: Signer;
  #contract: Contract;

  private constructor(signer: Signer, contract: Contract) {
    this.signer = signer;
    this.#contract = contract;
  }

  static async build({
    signer,
    options
  }: { signer: Signer; options: EvmGrantsOptions }): Promise<EvmGrants> {
    return new this(
      signer,
      new Contract(options.contractAddress ?? this.#defaultContractAddress, this.#abi, signer)
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
    owner = ZERO_ADDRESS,
    grantee = ZERO_ADDRESS,
    dataId = ZERO_DATA_ID
  }: Partial<Omit<Grant, "lockedUntil">> = {}): Promise<Grant[]> {
    if (owner == ZERO_ADDRESS && grantee == ZERO_ADDRESS)
      throw new Error("Must provide `owner` and/or `grantee`");

    const grants = await this.#contract.findGrants(owner, grantee, dataId);

    return grants.map(
      ([owner, grantee, dataId, lockedUntil]: [string, string, string, bigint]) =>
        new Grant({ owner, grantee, dataId, lockedUntil: Number(lockedUntil) })
    );
  }

  async create({
    grantee = ZERO_ADDRESS,
    dataId = ZERO_DATA_ID,
    lockedUntil = ZERO_TIMELOCK,
    wait = true
  }: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    if (grantee == ZERO_ADDRESS || dataId == ZERO_DATA_ID) {
      throw new Error("Must provide `grantee` and `dataId`");
    }

    const owner = await this.signer.getAddress();
    const grant: Grant = { owner, grantee, dataId, lockedUntil };

    let transaction;
    try {
      transaction = (await this.#contract.insertGrant(
        grantee,
        dataId,
        lockedUntil
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant creation failed", { cause: (e as Error).cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }

  async messageForCreateBySignature({
    owner,
    grantee,
    dataId,
    lockedUntil
  }: Grant): Promise<string> {
    return await this.#contract.insertGrantBySignatureMessage(owner, grantee, dataId, lockedUntil);
  }

  async createBySignature({
    owner,
    grantee,
    dataId,
    lockedUntil,
    signature,
    wait
  }: Grant & { signature: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    const grant: Grant = { owner, grantee, dataId, lockedUntil };

    let transaction;
    try {
      transaction = (await this.#contract.insertGrantBySignature(
        owner,
        grantee,
        dataId,
        lockedUntil,
        signature
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant creation by signature failed", { cause: (e as Error).cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }

  async revoke({
    grantee = ZERO_ADDRESS,
    dataId = ZERO_DATA_ID,
    lockedUntil = ZERO_TIMELOCK,
    wait = true
  }: Omit<Grant, "owner"> & { wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    if (grantee == ZERO_ADDRESS || dataId == ZERO_DATA_ID) {
      throw new Error("Must provide `grantee` and `dataId`");
    }

    const owner = await this.signer.getAddress();
    const grant: Grant = { owner, grantee, dataId, lockedUntil };

    let transaction;
    try {
      transaction = (await this.#contract.deleteGrant(
        grantee,
        dataId,
        lockedUntil
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant revocation failed", { cause: (e as Error).cause });
    }

    return await this.#grantPromise(grant, wait)(transaction);
  }

  async messageForRevokeBySignature({
    owner,
    grantee,
    dataId,
    lockedUntil
  }: Grant): Promise<string> {
    return await this.#contract.deleteGrantBySignatureMessage(owner, grantee, dataId, lockedUntil);
  }

  async revokeBySignature({
    owner,
    grantee,
    dataId,
    lockedUntil,
    signature,
    wait
  }: Grant & { signature: Uint8Array; wait?: boolean }): Promise<{
    grant: Grant;
    transactionId: string;
  }> {
    const grant: Grant = { owner, grantee, dataId, lockedUntil };

    let transaction;
    try {
      transaction = (await this.#contract.deleteGrantBySignature(
        owner,
        grantee,
        dataId,
        lockedUntil,
        signature
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant revocation by signature failed", { cause: (e as Error).cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }
}
