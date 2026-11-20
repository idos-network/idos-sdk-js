---
"facesign-enclave": patch
"idos-enclave": patch
"data-dashboard": patch
"embedded-wallet": patch
---

Pin each app's Vercel framework, install command and build command in `vercel.json`, and its Node major version in `engines.node`, so these can't be changed in the Vercel project settings. The values are the ones Vercel uses today: `pnpm install`, then the Turborepo build it selects for monorepos, with `--force` so the build never replays cached package builds from Turborepo's shared remote cache, on Node 24 (`idos-enclave` and `embedded-wallet` move from the 22.x project setting to 24.x, the version in `.node-version` that CI runs on).
