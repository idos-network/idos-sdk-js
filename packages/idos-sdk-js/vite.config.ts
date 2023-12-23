import path from "path";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/lib/index.ts"),
      name: "idOS",
      fileName: "idos-sdk"
    },
    rollupOptions: {
      // Don't bundle those dependencies
      external: ["near-api-js", "ethers"],
    },
  },
  plugins: [
    dts({
      rollupTypes: true
    })
  ],
  test: {
    globals: true,
    environment: "jsdom"
  }
});
