import {
  type KwilActionClient,
  type KwilSignerType,
  createKwilSigner,
  createWebKwilClient,
} from "@idos-network/core";

export interface IssuerConfig {
  kwilClient: KwilActionClient;
}

type CreateIssuerConfigParams = {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  // @todo: we should extract only the possible signer types from the core package.
  signer: KwilSignerType;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams): Promise<IssuerConfig> {
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
