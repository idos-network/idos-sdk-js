import path from "path";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: "window"
  },

  build: {
    target: "esnext"
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
