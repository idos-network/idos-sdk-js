import { type KwilActionClient, createKwilSigner, createNodeKwilClient } from "@idos-network/core";

export interface IssuerConfig {
  kwilClient: KwilActionClient;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
}

type CreateIssuerConfigParams = {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams): Promise<IssuerConfig> {
  const kwilClient = await createNodeKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
    dbId: params.dbId,
  });

  const [signer] = createKwilSigner(params.signingKeyPair);
  kwilClient.setSigner(signer);

  return {
    kwilClient,
    signingKeyPair: params.signingKeyPair,
    encryptionSecretKey: params.encryptionSecretKey,
  };
}
