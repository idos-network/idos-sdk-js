import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext"
  },
  plugins: [
    nodePolyfills({
      include: ["buffer"],
      globals: {
        Buffer: true
      }
    }),
    mkcert()
  ]
});
