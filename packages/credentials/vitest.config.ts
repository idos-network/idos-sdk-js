import { defineConfig } from "vitest/config";

import { coverageConfig } from "../../vitest.shared";

export default defineConfig({
  test: {
    globals: true,
    coverage: coverageConfig,
  },
});
