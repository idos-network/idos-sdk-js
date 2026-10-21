import { configDefaults, defineConfig } from "vitest/config";

import { coverageConfig } from "../../vitest.shared";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "integration/**"],
    coverage: {
      ...coverageConfig,
      exclude: [...coverageConfig.exclude, "src/**/*.mock.ts"],
    },
  },
});
