import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/lib/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
  outDir: "./dist",
});
