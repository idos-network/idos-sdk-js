# facesign-enclave

## 0.4.13

### Patch Changes

- 8643431: Pin the FaceSign service URLs, allowed origins, FaceTec settings and MPC configuration in source, chosen by the page's hostname, so a Vercel environment variable can no longer change them on a deployed host. The FaceSign handoff store only accepts the idOS Upstash host; the dev server may also use a Redis REST endpoint on loopback. Production FaceSign no longer accepts staging and playground origins.
- 01af44e: Pin each app's Vercel framework, install command and build command in `vercel.json`, and its Node major version in `engines.node`, so these can't be changed in the Vercel project settings. The values are the ones Vercel uses today: `pnpm install`, then the Turborepo build it selects for monorepos, with `--force` so the build never replays cached package builds from Turborepo's shared remote cache, on Node 24 (`idos-enclave` and `embedded-wallet` move from the 22.x project setting to 24.x, the version in `.node-version` that CI runs on).
- e51f520: Turn off FaceSign in the dashboard on every deployed environment, and show a "temporarily unavailable" message on the FaceSign enclave's home page.

## 0.4.12

### Patch Changes

- Updated dependencies [406ea59]
  - @idos-network/utils@3.3.0

## 0.4.11

### Patch Changes

- Updated dependencies [729c7d7]
  - @idos-network/utils@3.2.0

## 0.4.10

### Patch Changes

- Updated dependencies [1668234]
- Updated dependencies [38a1991]
  - @idos-network/utils@3.1.0

## 0.4.9

### Patch Changes

- 269267f: Stop accepting a `*` origin allowlist in the FaceSign enclave, and only return the wallet address to origins the user approved a session for.
- Updated dependencies [78ad0a9]
  - @idos-network/utils@3.0.1

## 0.4.8

### Patch Changes

- @idos-network/utils@3.0.0

## 0.4.7

### Patch Changes

- @idos-network/utils@2.3.0

## 0.4.6

### Patch Changes

- Updated dependencies [e1408a1]
  - @idos-network/utils@2.2.2

## 0.4.5

### Patch Changes

- @idos-network/utils@2.2.1

## 0.4.4

### Patch Changes

- 110c0ce: Make the FaceSign mobile handoff single-use so a completed session can't be overwritten and its token is handed to the desktop only once.
- a74cbd8: Show the verified postMessage origin on FaceSign session and sign approval dialogs.
- 1ca665d: Fix new oxlint
- Updated dependencies [56b18ea]
  - @idos-network/utils@2.2.0

## 0.4.3

### Patch Changes

- @idos-network/utils@2.1.0

## 0.4.2

### Patch Changes

- Updated dependencies [1fb5dff]
  - @idos-network/utils@2.0.1

## 0.4.1

### Patch Changes

- @idos-network/utils@2.0.0

## 0.4.0

### Minor Changes

- 76fd426: Upgrade dependencies

### Patch Changes

- Updated dependencies [76fd426]
  - @idos-network/utils@1.5.0

## 0.3.2

### Patch Changes

- Updated dependencies [5e8c407]
  - @idos-network/utils@1.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [565e87c]
  - @idos-network/utils@1.3.1

## 0.3.0

### Minor Changes

- 5a7f164: Upgrade facetec libraries

## 0.2.0

### Minor Changes

- 5afaf1a: Dependency updates

### Patch Changes

- Updated dependencies [5afaf1a]
  - @idos-network/utils@1.3.0

## 0.1.6

### Patch Changes

- 772319f: Minor and patch dependency upgrades
- 772319f: Minor and patch dependency upgrades
- Updated dependencies [772319f]
- Updated dependencies [772319f]
  - @idos-network/utils@1.2.1

## 0.1.5

### Patch Changes

- @idos-network/utils@1.2.0

## 0.1.4

### Patch Changes

- e5df318: Upgrade dependencies
- Updated dependencies [e5df318]
  - @idos-network/utils@1.1.1

## 0.1.3

### Patch Changes

- 7468451: Security updates of axios

## 0.1.2

### Patch Changes

- Updated dependencies [867ffcb]
  - @idos-network/utils@1.1.0

## 0.1.1

### Patch Changes

- Updated dependencies [ad4b090]
  - @idos-network/utils@1.0.0
