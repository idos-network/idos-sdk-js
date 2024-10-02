interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// biome-ignore lint/complexity/noBannedTypes: Its fine to have an empty env object for now.
type ImportMetaEnv = {};
