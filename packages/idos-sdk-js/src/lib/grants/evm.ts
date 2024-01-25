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

export class EvmGrants extends GrantChild {
  static #defaultContractAddress = import.meta.env.VITE_IDOS_EVM_DEFAULT_CONTRACT_ADDRESS;
  static defaultChainId = import.meta.env.VITE_IDOS_EVM_DEFAULT_CHAIN_ID;

  static #abi = [
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
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor"
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
    }
  ] as const;

  signer: Signer;
  defaultOwner: string;
  #contract: Contract;

  private constructor(signer: Signer, defaultOwner: string, contract: Contract) {
    super();
    this.signer = signer;
    this.defaultOwner = defaultOwner;
    this.#contract = contract;
  }

  static async build({
    signer,
    options
  }: { signer: Signer; options: EvmGrantsOptions }): Promise<EvmGrants> {
    return new this(
      signer,
      await signer.getAddress(),
      new Contract(options.contractAddress ?? this.#defaultContractAddress, this.#abi, signer)
    );
  }

  #newGrant({ owner, grantee, dataId, lockedUntil }: Omit<Grant, "owner"> & { owner?: string }) {
    (!owner || owner === ZERO_ADDRESS) && (owner = this.defaultOwner);

    return new Grant({ owner, grantee, dataId, lockedUntil });
  }

  #grantPromise(grant: Grant, wait = true) {
    return async (transaction: TransactionResponse) => {
      // `transaction.wait()` only returns null when given `confirms = 0`.
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
      ([owner, grantee, dataId, lockedUntil]: [string, string, string, number]) =>
        new Grant({ owner, grantee, dataId, lockedUntil })
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

    const grant = this.#newGrant({ grantee, dataId, lockedUntil });

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

    const grant = this.#newGrant({ grantee, dataId, lockedUntil });
    let transaction;

    try {
      transaction = (await this.#contract.deleteGrant(
        grantee,
        dataId,
        lockedUntil
      )) as TransactionResponse;
    } catch (e) {
      throw new Error("Grant creation failed", { cause: (e as Error).cause });
    }

    return await this.#grantPromise(grant, wait)(transaction);
  }
}
