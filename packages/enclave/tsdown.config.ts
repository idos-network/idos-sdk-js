import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/local.ts", "./src/mpc/index.ts"],
});
