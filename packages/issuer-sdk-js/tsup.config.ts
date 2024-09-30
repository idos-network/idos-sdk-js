import { config } from "@dotenvx/dotenvx";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/lib/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  env: config().parsed,
  format: ["esm"],
  outDir: "./dist",
});
