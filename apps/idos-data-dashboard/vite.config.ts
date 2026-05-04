import { reactRouter } from "@react-router/dev/vite";
import { type SentryReactRouterBuildOptions, sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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
    enabled:
      ["production", "playground"].includes(process.env.VERCEL_ENV ?? "") &&
      !!process.env.SENTRY_AUTH_TOKEN,
    filesToDeleteAfterUpload: ["**/*.js.map"],
  },
};

function copyPrismaSchemaToServerBuild(): Plugin {
  let root = "";
  let outDir = "";

  async function copySchema(schemaSource: string, schemaDestination: string) {
    await mkdir(dirname(schemaDestination), { recursive: true });
    await copyFile(schemaSource, schemaDestination);
  }

  return {
    name: "copy-prisma-schema-to-server-build",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const schemaSource = resolve(root, "prisma/schema.prisma");
      console.log(schemaSource);
      console.log(outDir);
      copySchema(schemaSource, resolve(outDir, "prisma/schema.prisma"));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async (config) => {
  const plugins = [
    tailwindcss(),
    reactRouter(),
    mkcert(),
    // https://github.com/getsentry/sentry-javascript/blob/master/dev-packages/e2e-tests/test-applications/react-router-7-framework-instrumentation/vite.config.ts#L9C77-L9C86
    // oxlint-disable-next-line typescript/no-explicit-any -- Expected
    ...((await sentryReactRouter(sentryConfig, config)) as any[]),
  ];

  if (config.isSsrBuild) {
    plugins.push(copyPrismaSchemaToServerBuild());
  }

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
      target: "esnext",
      rolldownOptions: {
        input: config.isSsrBuild ? "./server/app.ts" : undefined,
      },
    },

    resolve: {
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
      tsconfigPaths: true,
    },

    plugins,

    optimizeDeps: {
      exclude: ["@sentry/react-router"],
    },
  };
});
