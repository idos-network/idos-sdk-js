export const contractAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "grantee", type: "address" },
      { indexed: true, internalType: "string", name: "dataId", type: "string" },
      { indexed: false, internalType: "uint256", name: "lockedUntil", type: "uint256" },
    ],
    name: "GrantAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "grantee", type: "address" },
      { indexed: true, internalType: "string", name: "dataId", type: "string" },
      { indexed: false, internalType: "uint256", name: "lockedUntil", type: "uint256" },
    ],
    name: "GrantDeleted",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
      { internalType: "uint256", name: "lockedUntil", type: "uint256" },
    ],
    name: "deleteGrant",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
      { internalType: "uint256", name: "lockedUntil", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "deleteGrantBySignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
      { internalType: "uint256", name: "lockedUntil", type: "uint256" },
    ],
    name: "deleteGrantBySignatureMessage",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
    ],
    name: "findGrants",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "grantee", type: "address" },
          { internalType: "string", name: "dataId", type: "string" },
          { internalType: "uint256", name: "lockedUntil", type: "uint256" },
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
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
    ],
    name: "grantsFor",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "grantee", type: "address" },
          { internalType: "string", name: "dataId", type: "string" },
          { internalType: "uint256", name: "lockedUntil", type: "uint256" },
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
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
      { internalType: "uint256", name: "lockedUntil", type: "uint256" },
    ],
    name: "insertGrant",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
      { internalType: "uint256", name: "lockedUntil", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "insertGrantBySignature",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "grantee", type: "address" },
      { internalType: "string", name: "dataId", type: "string" },
      { internalType: "uint256", name: "lockedUntil", type: "uint256" },
    ],
    name: "insertGrantBySignatureMessage",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
];
