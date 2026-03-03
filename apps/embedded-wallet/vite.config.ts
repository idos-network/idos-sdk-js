import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5175,
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    mkcert(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
  build: {
    target: "esnext",
  },
});
