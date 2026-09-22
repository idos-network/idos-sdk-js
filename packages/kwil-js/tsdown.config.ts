import { defineConfig } from "tsdown";

export default defineConfig({
  dts: true,
  minify: true,
  entry: [
    "./src/index.ts",
    "./src/api_client/config.ts",
    "./src/core/action.ts",
    "./src/core/database.ts",
  ],
});
