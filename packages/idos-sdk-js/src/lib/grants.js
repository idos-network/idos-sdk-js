import { Contract } from "ethers";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export class Grants {
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

  #address = "0x9A961ECd4d2EEB84f990EcD041Cb108083A3C1BA";
  #contract;
  constructor(idOS) {
    this.idOS = idOS;
    this.#contract = new Contract(this.#address, this.#abi, this.idOS.kwilWrapper.signer);
  }

  async list({ owner = ZERO_ADDRESS, grantee = ZERO_ADDRESS, dataId = "0" }) {
    if (owner || grantee) {
      const grants = await this.#contract.findGrants(owner, grantee, dataId);
      return grants;
    } else {
      throw new Error("Must provide `owner` and/or `grantee`");
    }
  }

  create() {}

  revoke() {}
}
