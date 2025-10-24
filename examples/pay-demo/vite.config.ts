import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => {
  const plugins = [tailwindcss(), reactRouter(), tsconfigPaths()];

  return {
    build: {
      target: isSsrBuild ? "node22" : "esnext",
    },
    plugins,
  };
});
