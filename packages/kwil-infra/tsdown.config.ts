import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/actions/index.ts",
    "./src/signature-verification/index.ts",
    "./src/xrp/utils.ts",
    "./src/facesign/index.ts",
  ],
});
