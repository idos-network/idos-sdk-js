import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  outDir: "./dist",
  bundle: true,
  external: ["ripple-keypairs"],
  noExternal: ["@idos-network/core"],
});
