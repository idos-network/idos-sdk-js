import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";

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
  plugins: [dts()],
});
