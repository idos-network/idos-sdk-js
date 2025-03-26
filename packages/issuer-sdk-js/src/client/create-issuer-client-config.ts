import {
  type EnclaveOptions,
  IframeEnclave,
  Store,
  type Wallet,
  createClientKwilSigner,
  createWebKwilClient,
} from "@idos-network/core";
import { hasProfile } from "@idos-network/core/kwil-actions";

type CreateIssuerClientConfigParams = {
  chainId?: string;
  nodeUrl: string;
  signer: Wallet;
  enclaveOptions: Omit<EnclaveOptions, "mode">;
};

export async function createIssuerClientConfig(params: CreateIssuerClientConfigParams) {
  const store = new Store(window.localStorage);

  const kwilClient = await createWebKwilClient({
    nodeUrl: params.nodeUrl,
    chainId: params.chainId,
  });

  const [signer, userAddress] = await createClientKwilSigner(store, kwilClient, params.signer);
  kwilClient.setSigner(signer);

  const enclaveProvider = new IframeEnclave({
    ...params.enclaveOptions,
    mode: (await hasProfile(kwilClient, userAddress)) ? "existing" : "new",
  });

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

export type IssuerClientConfig = Awaited<ReturnType<typeof createIssuerClientConfig>>;
