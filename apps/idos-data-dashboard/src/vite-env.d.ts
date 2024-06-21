/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
  readonly VITE_FRACTAL_PROOF_URL_BASE?: string;
  readonly VITE_FRACTAL_PROOF_URL_CLIENT_ID?: string;
  readonly VITE_FRACTAL_PROOF_URL_REDIRECT_URI?: string;
};

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
