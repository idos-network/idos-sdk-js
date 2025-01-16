/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_DAPP_ENCRYPTION_PUBLIC_KEY: string;
};

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
