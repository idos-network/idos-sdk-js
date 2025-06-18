import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    target: isSsrBuild ? "node22" : "esnext",
  },
  server: {
    allowedHosts:["c7a2-2a01-5e0-400-120-e919-f857-60e4-257.ngrok-free.app"],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));
