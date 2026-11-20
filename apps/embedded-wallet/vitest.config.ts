import { defineConfig } from "vitest/config";

import { coverageConfig } from "../../vitest.shared";

// Separate from vite.config.ts so the React, Tailwind and polyfill plugins aren't loaded in tests.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: coverageConfig,
  },
});
