import { resolve } from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ["@near-wallet-selector/here-wallet"],
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          vendor: [
            "@chakra-ui/react",
            "@tanstack/react-query",
            "@emotion/react",
            "@emotion/styled",
            "framer-motion",
          ],
          web3: ["wagmi", "viem"],
        },
      },
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
    mkcert(),
  ],
  resolve: {
    dedupe: ["ethers", "near-api-js", "@near-wallet-selector/core"],
    alias: {
      "@": resolve(__dirname, "./src"),
      "@idos-network/utils/crypto/signature-verification": resolve(
        __dirname,
        "../../packages/utils/src/crypto/signature-verification/index.ts",
      ),
      "@idos-network/utils/crypto": resolve(__dirname, "../../packages/utils/src/crypto/index.ts"),
    },
  },
});
