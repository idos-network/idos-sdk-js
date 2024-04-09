import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          idos: ["@idos-network/idos-sdk"],
          vendor: [
            "@chakra-ui/react",
            "@tanstack/react-query",
            "@emotion/react",
            "@emotion/styled",
            "framer-motion"
          ],
          web3: ["wagmi", "viem"]
        }
      }
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
    dedupe: ["ethers", "near-api-js", "@near-wallet-selector/core"],
    alias: {
      "@": resolve(__dirname, "./src")
    }
  }
});
