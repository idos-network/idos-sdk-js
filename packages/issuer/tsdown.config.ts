import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  dts: true,
  external: [
    "@digitalbazaar/ed25519-signature-2020",
    "@digitalbazaar/ed25519-verification-key-2020",
    "@digitalbazaar/vc",
    "base85",
    "jsonld-document-loader",
    "web-streams-polyfill",
  ],
});
