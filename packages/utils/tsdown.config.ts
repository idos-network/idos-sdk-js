import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/encryption/index.ts", "./src/store/index.ts", "./src/enclave/index.ts", "./src/enclave/local.ts"],
  dts: true,
});
