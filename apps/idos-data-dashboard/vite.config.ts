import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => {
  const plugins = [tailwindcss(), reactRouter(), tsconfigPaths(), mkcert()];

  const manualChunks = (id: string) => {
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
    if (id.includes("near-connect") || id.includes("/near-api-js/")) return "near";

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
  };

  const output = { manualChunks };
  const rollupOptions = isSsrBuild ? { input: "./server/app.ts", output } : { output };

  return {
    build: {
      rollupOptions,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    ...(isSsrBuild
      ? []
      : [
          nodePolyfills({
            exclude: ["stream"],
            globals: {
              Buffer: true,
            },
          }),
        ]),
    plugins,
  };
});
