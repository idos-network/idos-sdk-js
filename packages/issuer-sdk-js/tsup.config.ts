import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/create-issuer-config.ts",
    "./src/human.ts",
    "./src/credentials.ts",
  ],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  outDir: "./dist",
  bundle: true,
  noExternal: ["@idos-network/kwil-nep413-signer"],
});
