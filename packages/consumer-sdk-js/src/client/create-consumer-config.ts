import type { EnclaveOptions } from "@idos-network/controllers";
import { type KwilSignerType, createKwilSigner, createWebKwilClient } from "@idos-network/core";

type CreateConsumerConfigParams = {
  chainId?: string;
  dbId?: string;
  nodeUrl: string;
  // @todo: we should extract only the possible signer types from the core package.
  signer: KwilSignerType;
  enclaveOptions: Omit<EnclaveOptions, "mode">;
};

export async function createConsumerConfig(params: CreateConsumerConfigParams) {
  const kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
    dbId: params.dbId,
  });

  const [signer] = createKwilSigner(params.signer);
  kwilClient.setSigner(signer);

  return {
    kwilClient,
    enclaveOptions: params.enclaveOptions,
  };
}

export type ConsumerConfig = Awaited<ReturnType<typeof createConsumerConfig>>;
