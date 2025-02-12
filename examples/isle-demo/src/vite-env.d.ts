/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
};

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
