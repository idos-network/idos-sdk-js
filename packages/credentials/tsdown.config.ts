import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/utils/index.ts", "./src/builder/index.ts", "./src/types/index.ts"],
  dts: true,
  external: [
    "@digitalbazaar/ed25519-signature-2020",
    "@digitalbazaar/ed25519-verification-key-2020",
    "@digitalbazaar/vc",
    "base85",
    "jsonld-document-loader",
  ],
});
