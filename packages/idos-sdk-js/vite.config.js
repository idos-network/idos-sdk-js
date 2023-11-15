import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      name: "idOS",
      fileName: "idos-sdk",
      formats: ["es", "umd"],
    },
  },
  plugins: [],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
