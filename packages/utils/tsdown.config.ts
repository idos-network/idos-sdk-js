import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/encryption/index.ts",
    "./src/store/index.ts",
    "./src/enclave/index.ts",
    "./src/enclave/local.ts",
    "./src/mpc/index.ts",
    "./src/codecs/index.ts",
    "./src/xrpl-credentials/index.ts",
    "./src/crypto/index.ts",
    "./src/crypto/signature-verification/index.ts",
  ],
  dts: true,
  noExternal: ["@wagmi/core", "@stellar/stellar-sdk", "@stellar/stellar-base", "ripple-keypairs"],
});
