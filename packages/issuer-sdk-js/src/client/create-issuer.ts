import { type KwilSignerType, createKwilSigner, createWebKwilClient } from "@idos-network/core";

type CreateIssuerParams = {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  // @todo: we should extract only the possible signer types from the core package.
  signer: KwilSignerType;
};

export async function createIssuer(params: CreateIssuerParams) {
  const kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
    dbId: params.dbId,
  });

  const [signer] = createKwilSigner(params.signer);
  kwilClient.setSigner(signer);

  return {
    kwilClient,
  };
}

export type IssuerConfig = Awaited<ReturnType<typeof createIssuer>>;
