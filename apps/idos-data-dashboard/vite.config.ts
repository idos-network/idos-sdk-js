import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: "globalThis"
  },

  build: {
    target: "esnext",
    rollupOptions: {
      // this is included because it breaks the build if not included
      // this is almost certainly a bug in wagmi (or these libraries transatively
      // and likely can be removed in the future
      external: [
        "@safe-globalThis/safe-apps-provider",
        "@safe-globalThis/safe-apps-sdk"
      ]
    }
  },

  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer"],
      globals: {
        Buffer: true
      }
    })
  ],

  resolve: {
    alias: {
      "#": path.resolve(__dirname, "./src")
    }
  },

  test: {
    globals: true,
    environment: "jsdom"
  }
});
