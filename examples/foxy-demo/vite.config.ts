import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    target: isSsrBuild ? "node22" : "esnext",
    rollupOptions: {
      external: [
        "@digitalbazaar/ed25519-signature-2020",
        "@digitalbazaar/ed25519-verification-key-2020",
        "@digitalbazaar/vc",
        "jsonld-document-loader",
        "base85",
      ],
    },
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));
