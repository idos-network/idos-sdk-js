import {
  type EnclaveOptions,
  IframeEnclave,
  Store,
  type Wallet,
  createFrontendKwilSigner,
  createWebKwilClient,
} from "@idos-network/core";

type CreateConsumerClientConfigParams = {
  chainId?: string;
  nodeUrl: string;
  signer: Wallet;
  enclaveOptions: Omit<EnclaveOptions, "mode">;
};

export async function createConsumerClientConfig(params: CreateConsumerClientConfigParams) {
  const store = new Store(window.localStorage);

  const kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
  });

  const [signer] = await createFrontendKwilSigner(store, kwilClient, params.signer);
  kwilClient.setSigner(signer);

  const enclaveProvider = new IframeEnclave(params.enclaveOptions);
  await enclaveProvider.load();

  return {
    store,
    kwilClient,
    enclaveProvider,
  };
}

export type ConsumerClientConfig = Awaited<ReturnType<typeof createConsumerClientConfig>>;
