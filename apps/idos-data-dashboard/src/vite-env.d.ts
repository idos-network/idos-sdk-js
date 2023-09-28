/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DB_NAME: string;
  readonly VITE_DB_OWNER: string;
  readonly VITE_DB_PROVIDER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
