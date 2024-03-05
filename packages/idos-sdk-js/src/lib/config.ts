import type { Store } from "../../../idos-store";
import type { ProviderType } from "./enclave";
import type { IframeEnclaveOptions, MetaMaskSnapEnclaveOptions, ServerProviderOptions } from "./enclave-providers";
import type { EvmGrantsOptions, NearGrantsOptions } from "./grants";

export interface ConfigParams {
  dbId?: string;
  db?: {
    url?: string;
    id?: string;
    chainId?: string;
  },
  enclave?: {
    provider?: ProviderType;
    options: {
      iframe?: IframeEnclaveOptions;
      metamask?: MetaMaskSnapEnclaveOptions;
      server?: ServerProviderOptions;
    }
  }
  grants?: {
    evm?: EvmGrantsOptions;
    near?: NearGrantsOptions;
  },
  customStore?: Store;
}

export class Config {
  readonly db: {
    url: string;
    id: string;
    chainId: string;
  };

  readonly enclave: {
    provider: ProviderType;
    options: {
      iframe?: IframeEnclaveOptions;
      metamask?: MetaMaskSnapEnclaveOptions;
      server?: ServerProviderOptions;
    },
  };

  readonly grants: {
    readonly evm: EvmGrantsOptions;
    readonly near: NearGrantsOptions;
  };

  readonly customStore?: Store;

  constructor(params: ConfigParams) {
    Object.assign(this, params);

    this.enclave = {
      provider: "iframe",
      options: {},
      ...params.enclave,
    };

    this.db = {
      url: import.meta.env.VITE_IDOS_NODE_URL,
      chainId: import.meta.env.VITE_IDOS_NODE_KWIL_CHAIN_ID,
      id: import.meta.env.VITE_IDOS_NODE_KWIL_DB_ID,
      ...params.db,
    };

    this.grants = {
      evm: {
        contractAddress: import.meta.env.VITE_IDOS_EVM_DEFAULT_CONTRACT_ADDRESS,
        chainId: import.meta.env.VITE_IDOS_EVM_DEFAULT_CHAIN_ID,
        ...params.grants?.evm ?? {},
      },

      near: {
        network: import.meta.env.VITE_IDOS_NEAR_DEFAULT_NETWORK,
        contractId: import.meta.env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID,
        rpcUrl: import.meta.env.VITE_IDOS_NEAR_DEFAULT_RPC_URL,
        ...params.grants?.near ?? {},
      },
    }


    this.validate();
  }

  validate() {
    if (this.enclave.provider === "iframe" && !this.enclave.options?.iframe) {
      throw new Error("enclave.options.iframe is required when enclave.provider is iframe");
    }

    if (this.enclave.provider === "server" && !this.enclave.options?.server) {
      throw new Error("enclave.options.server is required when enclave.provider is server");
    }
  }
}

export default function createConfig(params: ConfigParams): Config {
  return new Config(params);
}
