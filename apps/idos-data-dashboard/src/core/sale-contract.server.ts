import { type Address, createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";

export const ctzndSaleAddress = "0x8e8DA19D9defA39B11C106AeA29EbF71e5BeF978" as const;

const ctzndSaleAbi = [
  {
    type: "function",
    inputs: [{ name: "_to", internalType: "address", type: "address" }],
    name: "allocation",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "_to", internalType: "address", type: "address" }],
    name: "uncappedAllocation",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "individualCap",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "totalUncappedAllocations",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "maxTarget",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "minTarget",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "investorCount",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "totalTokensForSale",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

function getClient() {
  return createPublicClient({
    chain: arbitrum,
    transport: http(),
  });
}

export async function readSaleContractMulticall(contributionAddress: Address) {
  const client = getClient();

  const results = await client.multicall({
    contracts: [
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "totalUncappedAllocations",
      },
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "uncappedAllocation",
        args: [contributionAddress],
      },
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "allocation",
        args: [contributionAddress],
      },
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "individualCap",
      },
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "maxTarget",
      },
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "minTarget",
      },
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "investorCount",
      },
      {
        address: ctzndSaleAddress,
        abi: ctzndSaleAbi,
        functionName: "totalTokensForSale",
      },
    ],
  });

  return {
    totalUncappedAllocations: results[0].status === "success" ? results[0].result : 0n,
    uncappedAllocation: results[1].status === "success" ? results[1].result : 0n,
    allocation: results[2].status === "success" ? results[2].result : 0n,
    individualCap: results[3].status === "success" ? results[3].result : 0n,
    maxTarget: results[4].status === "success" ? results[4].result : 0n,
    minTarget: results[5].status === "success" ? results[5].result : 0n,
    investorCount: results[6].status === "success" ? results[6].result : 0n,
    totalTokensForSale: results[7].status === "success" ? results[7].result : 0n,
  };
}
