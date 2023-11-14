import { Contract, ZeroAddress } from "ethers";

const ZERO_ADDRESS = ZeroAddress;
const ZERO_DATA_ID = "0";
const ZERO_TIMELOCK = 0;

class Grant {
  constructor({ owner, grantee, dataId, lockedUntil }) {
    Object.assign(this, { owner, grantee, dataId, lockedUntil });
  }
}

export class EvmGrants {
  #defaultContractAddress = import.meta.env.VITE_IDOS_EVM_DEFAULT_CONTRACT_ADDRESS;

  #abi = [
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
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
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
  ];
  #contract;

  constructor() {}

  async init({ signer } = {}) {
    this.signer = signer;
    this.defaultOwner = await this.signer.getAddress();
    this.#contract = new Contract(this.#defaultContractAddress, this.#abi, this.signer);
  }

  #newGrant({ owner, grantee, dataId, lockedUntil }) {
    (!owner || owner === ZERO_ADDRESS) && (owner = this.defaultOwner);
    return new Grant({ owner, grantee, dataId, lockedUntil });
  }

  #grantPromise(grant, wait = true) {
    return async (transaction) => {
      const transactionOrReceipt = wait ? await transaction.wait() : transaction;
      const transactionId = transactionOrReceipt.hash;
      return { grant, transactionId };
    };
  }

  async list({ owner = ZERO_ADDRESS, grantee = ZERO_ADDRESS, dataId = ZERO_DATA_ID } = {}) {
    if (owner == ZERO_ADDRESS && grantee == ZERO_ADDRESS) {
      throw new Error("Must provide `owner` and/or `grantee`");
    }
    const grants = await this.#contract.findGrants(owner, grantee, dataId);
    return grants.map(([owner, grantee, dataId, lockedUntil]) => new Grant({ owner, grantee, dataId, lockedUntil }));
  }

  async create({ grantee = ZERO_ADDRESS, dataId = ZERO_DATA_ID, lockedUntil = ZERO_TIMELOCK, wait = true } = {}) {
    if (grantee == ZERO_ADDRESS || dataId == ZERO_DATA_ID) {
      throw new Error("Must provide `grantee` and `dataId`");
    }
    const grant = this.#newGrant({ grantee, dataId, lockedUntil });
    let transaction;

    try {
      transaction = await this.#contract.insertGrant(grantee, dataId, lockedUntil);
    } catch (e) {
      throw new Error("Grant creation failed", { cause: e.cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }

  async revoke({ grantee = ZERO_ADDRESS, dataId = ZERO_DATA_ID, lockedUntil = ZERO_TIMELOCK, wait = true } = {}) {
    if (grantee == ZERO_ADDRESS || dataId == ZERO_DATA_ID) {
      throw new Error("Must provide `grantee` and `dataId`");
    }
    const grant = this.#newGrant({ grantee, dataId, lockedUntil });
    let transaction;

    try {
      transaction = this.#contract.deleteGrant(grantee, dataId, lockedUntil);
    } catch (e) {
      throw new Error("Grant creation failed", { cause: e.cause });
    }
    return await this.#grantPromise(grant, wait)(transaction);
  }
}
