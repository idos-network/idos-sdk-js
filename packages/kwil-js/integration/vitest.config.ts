import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
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
