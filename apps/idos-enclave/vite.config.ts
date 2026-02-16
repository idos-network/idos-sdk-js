import { createRequire } from "node:module";
import { resolve } from "node:path";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

const require = createRequire(import.meta.url);

export default defineConfig({
  define: {
    global: "window",
  },
  resolve: {
    alias: {
      buffer: "buffer",
      react: require.resolve("preact/compat"),
      "react-dom": require.resolve("preact/compat"),
    },
  },
  optimizeDeps: {
    include: ["preact/compat"],
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
