import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // These tests assert on internals that kwil-js deliberately does not export.
      "kwil-js-src": fileURLToPath(new URL("../../packages/kwil-js/src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    // A live Kwil node mines blocks; these are nowhere near unit-test speed.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Tests share one namespace per suite on a single node, so they cannot overlap.
    fileParallelism: false,
  },
});
