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
    "./src/signature-verification/index.ts",
    "./src/facesign/index.ts",
  ],
  external: [
    "@digitalbazaar/ed25519-signature-2020",
    "@digitalbazaar/ed25519-verification-key-2020",
    "@digitalbazaar/vc",
    "base85",
    "jsonld-document-loader",
    "@wagmi/core",
  ],
});
