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
  external: ["ripple-keypairs"],
  noExternal: ["@idos-network/core"],
});
