import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    target: isSsrBuild ? "node22" : "esnext",
  },
  server: {
    allowedHosts: ["9674-185-154-60-133.ngrok-free.app"],
  },
  define: {
    "process.env.NODE_DEBUG": "false",
    global: {},
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
}));
