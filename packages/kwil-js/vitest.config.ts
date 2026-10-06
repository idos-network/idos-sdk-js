import { defineConfig } from "vitest/config";

import { coverageConfig } from "../../vitest.shared";

export default defineConfig({
  test: {
    coverage: {
      ...coverageConfig,
      exclude: [...coverageConfig.exclude, "src/**/*.mock.ts"],
    },
  },
});
