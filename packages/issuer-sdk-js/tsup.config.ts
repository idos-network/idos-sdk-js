import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/client/index.ts",
    "./src/server/index.ts",
    "./src/create-issuer-config.ts",
    "./src/user.ts",
    "./src/credentials.ts",
    "./src/grants.ts",
  ],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ["esm"],
  outDir: "./dist",
  bundle: true,
  dts: true,
  noExternal: [
    "@idos-network/kwil-nep413-signer",
    "@idos-network/idos-sdk-types",
    "@idos-network/codecs",
  ],
});
