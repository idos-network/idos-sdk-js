import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test", quiet: true });

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

import { coverageConfig } from "../../vitest.shared";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: rootDir,
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      ...coverageConfig,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/generated/**"],
    },
  },
});
