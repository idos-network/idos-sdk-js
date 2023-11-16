/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_URL: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
