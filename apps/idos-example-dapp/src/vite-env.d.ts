/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FRACTAL_ID_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
