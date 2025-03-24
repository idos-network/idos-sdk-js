import {
  Store,
  type Wallet,
  createFrontendKwilSigner,
  createWebKwilClient,
} from "@idos-network/core";

type CreateIssuerConfigParams = {
  chainId?: string;
  nodeUrl: string;
  signer: Wallet;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams) {
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
  };
}

export type IssuerConfig = Awaited<ReturnType<typeof createIssuerConfig>>;
