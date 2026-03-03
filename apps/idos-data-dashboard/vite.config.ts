import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { type SentryReactRouterBuildOptions, sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

// On Vercel, VITE_SENTRY_ENV can be set in Project Settings. If unset, we fall back to VERCEL_ENV.
if (process.env.VERCEL_ENV && !process.env.VITE_SENTRY_ENVIRONMENT) {
  process.env.VITE_SENTRY_ENVIRONMENT = process.env.VERCEL_ENV;
}

if (process.env.VERCEL_DEPLOYMENT_ID && !process.env.VITE_SENTRY_RELEASE) {
  process.env.VITE_SENTRY_RELEASE = process.env.VERCEL_DEPLOYMENT_ID;
}

const sentryConfig: SentryReactRouterBuildOptions = {
  org: "idos-network",
  project: "data-dashboard",
  // An auth token is required for uploading source maps;
  // store it in an environment variable to keep it secure.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourceMapsUploadOptions: {
    enabled: ["production", "playground"].includes(process.env.VERCEL_ENV ?? ""),
  },
};

// https://vitejs.dev/config/
export default defineConfig(async (config) => {
  const plugins = [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    mkcert(),
    // https://github.com/getsentry/sentry-javascript/blob/master/dev-packages/e2e-tests/test-applications/react-router-7-framework-instrumentation/vite.config.ts#L9C77-L9C86
    // biome-ignore lint/suspicious/noExplicitAny: Expected
    ...((await sentryReactRouter(sentryConfig, config)) as any[]),
  ];

  if (!config.isSsrBuild) {
    plugins.push(
      nodePolyfills({
        include: ["buffer"],
        globals: {
          Buffer: true,
        },
      }),
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
