import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

import { coverageConfig } from "../../vitest.shared";

// Separate from vite.config.ts so the Preact and polyfill plugins aren't loaded in tests.
// The e2e/ Playwright specs run with `pnpm test:e2e`.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: coverageConfig,
  },
});
