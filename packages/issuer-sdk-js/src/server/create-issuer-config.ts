import {
  type KwilActionClient,
  createBackendKwilSigner,
  createNodeKwilClient,
} from "@idos-network/core";

export interface IssuerConfig {
  kwilClient: KwilActionClient;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
}

type CreateIssuerConfigParams = {
  chainId?: string;
  nodeUrl: string;
  signingKeyPair: nacl.SignKeyPair;
  encryptionSecretKey: Uint8Array;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams): Promise<IssuerConfig> {
  const kwilClient = await createNodeKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
  });

  const [signer] = createBackendKwilSigner(params.signingKeyPair);
  kwilClient.setSigner(signer);

  return {
    kwilClient,
    signingKeyPair: params.signingKeyPair,
    encryptionSecretKey: params.encryptionSecretKey,
  };
}
