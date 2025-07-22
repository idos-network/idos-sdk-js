import { resolve } from "node:path";
import preact from "@preact/preset-vite";
import inject from "@rollup/plugin-inject";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  define: {
    global: "window",
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
    inject({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
});
