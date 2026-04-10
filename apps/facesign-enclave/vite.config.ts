import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./app"),
    },
    tsconfigPaths: true,
  },
  server: {
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [reactRouter(), mkcert(), tailwindcss()],
});
