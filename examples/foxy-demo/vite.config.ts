import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    target: isSsrBuild ? "node22" : "esnext",
  },
  server: {
    allowedHosts: ["4cae-185-154-60-133.ngrok-free.app"],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));
