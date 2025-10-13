import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  define: {
    global: "window",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  plugins: [
    mkcert(),
    tailwindcss(),
    tsconfigPaths(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
});
