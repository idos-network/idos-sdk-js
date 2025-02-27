import { type KwilSignerType, createKwilSigner, createWebKwilClient } from "@idos-network/core";

type CreateIssuerConfigParams = {
  chainId?: string;
  nodeUrl: string;
  // @todo: we should extract only the possible signer types from the core package.
  signer: KwilSignerType;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams) {
  const kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
  });

  const [signer] = createKwilSigner(params.signer);
  kwilClient.setSigner(signer);

  return {
    kwilClient,
  };
}

export type IssuerConfig = Awaited<ReturnType<typeof createIssuerConfig>>;
