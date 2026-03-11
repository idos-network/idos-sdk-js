import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  entry: ["./src/index.ts", "./src/local.ts", "./src/mpc/index.ts"],
});
