import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

// On Vercel, VITE_SENTRY_ENV can be set in Project Settings. If unset, we fall back to VERCEL_ENV.
if (process.env.VERCEL_ENV && !process.env.VITE_SENTRY_ENV) {
  process.env.VITE_SENTRY_ENV = process.env.VERCEL_ENV;
}

// https://vitejs.dev/config/
export default defineConfig((config) => {
  const plugins = [tailwindcss(), reactRouter(), tsconfigPaths(), mkcert()];

  if (config.isSsrBuild) {
    plugins.push(
      nodePolyfills({
        exclude: ["stream"],
        globals: {
          Buffer: true,
        },
      }),
    );

    plugins.push(
      sentryReactRouter(
        {
          org: "idos-network",
          project: "data-dashboard",
          authToken: process.env.SENTRY_AUTH_TOKEN,
        },
        config,
      ),
    );
  }

  return {
    build: {
      rollupOptions: config.isSsrBuild ? { input: "./server/app.ts" } : undefined,
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    plugins,

    optimizeDeps: {
      exclude: ["@sentry/react-router"],
    },
  };
});
