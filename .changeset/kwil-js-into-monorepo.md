---
"@idos-network/kwil-js": minor
"@idos-network/kwil-infra": patch
"@idos-network/consumer": patch
"@idos-network/issuer": patch
"@idos-network/client": patch
---

Move `@idos-network/kwil-js` into the monorepo and align it with the other packages.

- ESM-only build via `tsdown`, tests on `vitest` (was `tsc` + a custom esbuild script and `jest`)
- Public subpath exports renamed: `@idos-network/kwil-js/dist/api_client/config` -> `/config`, `/dist/core/action` -> `/action`, `/dist/core/database` -> `/database`
- Removed the deprecated `getSchema`, `deploy`, `drop` and `listDatabases` methods, which only threw
- Dropped the `jssha`, `long` and `uuid` dependencies in favour of `@noble/hashes` and platform built-ins
- Integration tests moved to the private `kwil-js-integration` app, which runs them against a live Kwil node outside CI
