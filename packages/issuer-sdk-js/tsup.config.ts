import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ["esm"],
  outDir: "./dist",
  bundle: true,
  dts: true,
  noExternal: ["@idos-network/kwil-nep413-signer", "@idos-network/core", "@idos-network/codecs"],
});
