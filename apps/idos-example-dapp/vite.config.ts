import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import mkcert from "vite-plugin-mkcert";

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
