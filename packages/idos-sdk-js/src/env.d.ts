/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_IDOS_ENCLAVE_URL: string;
  readonly VITE_IDOS_NODE_URL: string;
  readonly VITE_IDOS_NODE_KWIL_DB_ID: string;
  readonly VITE_IDOS_NODE_KWIL_CHAIN_ID: string;
  readonly VITE_IDOS_EVM_DEFAULT_CONTRACT_ADDRESS: string;
  readonly VITE_IDOS_EVM_DEFAULT_CHAIN_ID: string;
  readonly VITE_IDOS_NEAR_DEFAULT_NETWORK: string;
  readonly VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID: string;
  readonly VITE_IDOS_NEAR_DEFAULT_RPC_URL: string;
  readonly VITE_FRACTAL_ID_URL: string;
  readonly VITE_FRACTAL_ID_ISSUER_CREDENTIAL_PUBLIC_KEY_MULTIBASE: string;
}
