import { type EnclaveOptions, IframeEnclave } from "@idos-network/controllers/enclave";
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
  enclaveOptions: Omit<EnclaveOptions, "mode">;
};

export async function createIssuerConfig(params: CreateIssuerConfigParams) {
  const store = new Store(window.localStorage);

  const kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
  });

  const [signer, userAddress] = await createFrontendKwilSigner(store, kwilClient, params.signer);
  kwilClient.setSigner(signer);

  const enclaveProvider = new IframeEnclave(params.enclaveOptions);
  await enclaveProvider.load();

  return {
    store,
    kwilClient,
    enclaveProvider,
    get signer() {
      return signer;
    },
    userAddress,
  };
}

export type IssuerConfig = Awaited<ReturnType<typeof createIssuerConfig>>;
