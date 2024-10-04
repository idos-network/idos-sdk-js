import type { ServerResponse } from "node:http";
import getRawBody from "raw-body";
import { type Connect, type ViteDevServer, defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import evmHandler from "./api/EVM";
import nearHandler from "./api/NEAR";

import { VercelRequest, type VercelResponse } from "@vercel/node";

const injectRawBody = (req, res, next) => {
  getRawBody(req, {}, (err, string) => {
    if (err) return next(err);
    // biome-ignore lint/suspicious/noExplicitAny: 🤠
    (req as any).rawBody = string;
    next();
  });
};

const adaptVercelHandler = (
  handler: (VercelRequest, VercelResponse) => Promise<VercelResponse>,
) => {
  return async (req: Connect.IncomingMessage, res: ServerResponse) => {
    // biome-ignore lint/suspicious/noExplicitAny: 🤠
    (req as any).read = function () {
      return this.rawBody;
    };
    // biome-ignore lint/suspicious/noExplicitAny: 🤠
    (res as any).status = function (n: number) {
      this.statusCode = n;
      return this;
    };
    // biome-ignore lint/suspicious/noExplicitAny: 🤠
    (res as any).send = function (chunk: any) {
      this.write(chunk);
      return this;
    };
    // biome-ignore lint/suspicious/noExplicitAny: 🤠
    (res as any).json = function (obj: unknown) {
      this.setHeader("Content-type", "application/json");
      this.write(JSON.stringify(obj));
      return this;
    };

    //@ts-ignore This is close enough for our purposes.
    const newRes = await handler(req, res);
    newRes.end();
    return newRes;
  };
};

const devBackendPlugin = () => ({
  name: "dev-backend-plugin",
  configureServer(server: ViteDevServer) {
    server.middlewares
      .use(injectRawBody)
      .use("/api/EVM", adaptVercelHandler(evmHandler))
      .use("/api/NEAR", adaptVercelHandler(nearHandler));
  },
  apply: "serve" as const,
});

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    rollupOptions: {
      manualChunks: {
        ethers: ["ethers"],
        "near-api-js": ["near-api-js"],
      },
    },
  },
  plugins: [
    nodePolyfills({
      include: ["buffer"],
      globals: {
        Buffer: true,
      },
    }),
    devBackendPlugin(),
    mkcert(),
  ],
});
