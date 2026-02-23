import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // React core
          if (id.includes("/react-dom/") || /\/node_modules\/react\//.test(id)) return "react";

          // TanStack
          if (id.includes("@tanstack/react-router")) return "tanstack-router";
          if (id.includes("@tanstack/react-query")) return "tanstack-query";

          // State management
          if (id.includes("/xstate/") || id.includes("@xstate/")) return "xstate";

          // Web3 — EVM (always loaded: WagmiProvider is at root)
          if (
            id.includes("@reown/") ||
            id.includes("/wagmi/") ||
            id.includes("@wagmi/") ||
            id.includes("/viem/")
          )
            return "wagmi";
          if (id.includes("/ethers/")) return "ethers";

          // Web3 — NEAR (lazy-loaded)
          if (id.includes("@near-wallet-selector/") || id.includes("/near-api-js/")) return "near";

          // Web3 — Stellar (lazy-loaded)
          if (
            id.includes("stellar-wallets-kit") ||
            id.includes("stellar-base") ||
            id.includes("stellar-sdk")
          )
            return "stellar";

          // Web3 — XRPL (lazy-loaded)
          if (id.includes("@gemwallet/") || id.includes("/ripple-") || id.includes("/xumm/"))
            return "xrpl";

          // Icons
          if (id.includes("lucide-react")) return "icons";
        },
      },
    },
  },
  plugins: [
    devtools(),
    tanstackRouter({
      autoCodeSplitting: true,
      target: "react",
    }),
    react(),
    tailwindcss(),
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
    },
  },
});
