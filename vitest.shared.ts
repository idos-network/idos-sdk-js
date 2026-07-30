// Shared coverage config for all packages. Imported by each package's vitest.config.ts
// so the reporters (json-summary + json are required by the PR-comment CI action) stay in sync.
export const coverageConfig = {
  provider: "v8" as const,
  reportOnFailure: true,
  reporter: ["text", "json", "json-summary"],
  include: ["src/**/*.ts"],
  exclude: ["src/**/*.test.ts", "src/generated/**"],
};
