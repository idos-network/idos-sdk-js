import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    build: {
      target: "esnext"
    },
    plugins: [react(), nodePolyfills({
      include: ["buffer"],
      globals: {
        Buffer: true,
      },
    })],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    define: {
      global: "window"
    }
  };
});
