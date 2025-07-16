import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/encryption/index.ts", "./src/store/index.ts"],
  dts: true,
});
