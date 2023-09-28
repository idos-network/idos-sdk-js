import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Contract } from "ethers";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { createMutation } from "react-query-kit";

import { accountAtom, signerAtom } from "@/lib/store";

const abi = [
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
// const address = "0xdFfd3319Bb0978Ea656da41Bb8728eE163AA33F2";
const address = "0x9A961ECd4d2EEB84f990EcD041Cb108083A3C1BA";

export function useContract() {
  const signer = useAtomValue(signerAtom);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMemo(() => new Contract(address, abi, signer as any), [signer]);
}

export function useInsertGrant() {
  const contract = useContract();

  return createMutation({
    mutationFn({ address, id }: { address: string; id: string }) {
      return contract.insertGrant(address, id, 0);
    },
  })();
}

export function useRemoveGrant() {
  const contract = useContract();
  return createMutation({
    mutationFn({ address, id, lockedUntil = 0 }: { address: string; id: string; lockedUntil: number }) {
      return contract.deleteGrant(address, id, lockedUntil);
    },
  })();
}

export function useGrants(): UseQueryResult<Array<[string, string, string, string]>> {
  const contract = useContract();
  const account = useAtomValue(accountAtom);

  return useQuery({
    queryKey: ["grants"],
    queryFn: () => contract.findGrants(account, "0x0000000000000000000000000000000000000000", "0"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (data) => data.toArray().map((v: any) => v.toArray()),
    enabled: !!account && !!contract.runner,
  });
}
