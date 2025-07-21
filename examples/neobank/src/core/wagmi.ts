import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import type { Account, Chain, Client } from "viem";
import { type Config, type Transport, useConnectorClient } from "wagmi";

/**
 * Converts a viem Client to an ethers.js JsonRpcSigner
 */
export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);

  return signer;
}

/**
 * Hook to convert a wagmi Wallet Client to an ethers.js Signer
 * This is the main hook you'll use to get a signer from Reown AppKit
 */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId });

  return useMemo(() => {
    return client ? clientToSigner(client) : undefined;
  }, [client]);
}
