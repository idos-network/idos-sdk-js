import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/utils/index.ts",
    "./src/builder/index.ts",
    "./src/parser/index.ts",
    "./src/types/index.ts",
  ],
  dts: true,
  deps: {
    neverBundle: [
      "@digitalbazaar/ed25519-signature-2020",
      "@digitalbazaar/ed25519-verification-key-2020",
      "@digitalbazaar/vc",
      "base85",
      "jsonld-document-loader",
    ],
  },
});
