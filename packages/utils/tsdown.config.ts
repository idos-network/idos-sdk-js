import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/encryption/index.ts", "./src/store/index.ts", "./src/codecs/index.ts"],
  dts: true,
});
