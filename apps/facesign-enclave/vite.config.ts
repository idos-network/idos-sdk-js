import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
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
      "@": resolve(__dirname, "./src"),
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
  server: {
    // Enable CORS for iframe embedding during development
    cors: true,
    headers: {
      // Allow iframe embedding from any origin in development
      "Access-Control-Allow-Origin": "*",
      // Note: Removed CSP frame-ancestors to allow file:// protocol for testing
      // In production, add specific frame-ancestors via server configuration
    },
  },
  plugins: [
    tanstackRouter({ autoCodeSplitting: true, target: "react" }),
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
