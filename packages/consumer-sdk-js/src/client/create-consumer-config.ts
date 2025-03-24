import type { EnclaveOptions } from "@idos-network/controllers";
import {
  Store,
  type Wallet,
  createFrontendKwilSigner,
  createWebKwilClient,
} from "@idos-network/core";

type CreateConsumerConfigParams = {
  chainId?: string;
  nodeUrl: string;
  signer: Wallet;
  enclaveOptions: Omit<EnclaveOptions, "mode">;
};

export async function createConsumerConfig(params: CreateConsumerConfigParams) {
  const store = new Store(window.localStorage);

  const kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
  });

  const [signer] = await createFrontendKwilSigner(store, kwilClient, params.signer);
  kwilClient.setSigner(signer);

  return {
    store,
    kwilClient,
    enclaveOptions: params.enclaveOptions,
  };
}

export type ConsumerConfig = Awaited<ReturnType<typeof createConsumerConfig>>;
