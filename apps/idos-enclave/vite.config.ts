import { resolve } from "node:path";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({
  define: {
    global: {},
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dialog: resolve(__dirname, "dialog.html"),
      },
    },
  },
  plugins: [
    mkcert(),
    preact(),
    tailwindcss(),
    tsconfigPaths(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
});
