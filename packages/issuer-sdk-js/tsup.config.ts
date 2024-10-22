import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/create-issuer-config.ts",
    "./src/human.ts",
    "./src/credentials.ts",
    "./src/types.ts",
  ],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ["esm"],
  outDir: "./dist",
  bundle: true,
  noExternal: ["@idos-network/kwil-nep413-signer", "@idos-network/idos-sdk-types"],
});
