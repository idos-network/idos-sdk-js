import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: isSsrBuild ? { input: "./server/app.ts" } : undefined,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    mkcert(),
    ...(isSsrBuild
      ? []
      : [
          nodePolyfills({
            exclude: ["stream", "crypto"],
            globals: {
              // This is for @near-wallet-selector/core
              Buffer: true,
            },
          }),
        ]),
  ],
}));
