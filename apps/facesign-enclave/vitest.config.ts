import { defineConfig } from "vitest/config";

import { coverageConfig } from "../../vitest.shared";

// Separate from vite.config.ts so the React Router plugin isn't loaded in tests.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    coverage: {
      ...coverageConfig,
      include: ["app/**/*.{ts,tsx}"],
      exclude: ["app/**/*.test.{ts,tsx}", "app/assets/facetec/**"],
    },
  },
});
