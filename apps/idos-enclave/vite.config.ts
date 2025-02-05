import { resolve } from "path";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

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
  plugins: [mkcert(), preact()],
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
});
