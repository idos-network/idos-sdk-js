import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  entry: [
    "./src/store/index.ts",
    "./src/codecs/index.ts",
    "./src/cryptography/index.ts",
    "./src/encryption/index.ts",
    "./src/facesign/index.ts",
  ],
});
