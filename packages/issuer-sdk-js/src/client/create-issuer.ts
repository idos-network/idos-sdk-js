import {
  type KwilActionClient,
  type KwilSignerType,
  createKwilSigner,
  createWebKwilClient,
  hasProfile,
} from "@idos-network/core";

type CreateIssuerParams = {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  // @todo: we should extract only the possible signer types from the core package.
  signer: KwilSignerType;
};

let kwilClient: KwilActionClient;

export async function createIssuer(params: CreateIssuerParams) {
  kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
    dbId: params.dbId,
  });

  const [signer] = createKwilSigner(params.signer);
  kwilClient.setSigner(signer);

  return {
    kwilClient,
    checkUserProfile,
  };
}

export async function checkUserProfile(address: string) {
  return hasProfile(kwilClient, address);
}
