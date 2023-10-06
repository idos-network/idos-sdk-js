import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.js"),
      name: "idOS",
      fileName: "idos-sdk",
      formats: ["es", "umd"],
    },
  },
  plugins: [],
});
