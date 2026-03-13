# idOS JavaScript SDK

![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

> **Legalities**
>
> By downloading, installing, or implementing any of the idOS' SDKs, you acknowledge that you have read and understood idOS' Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## SDKs

| Folder                                    | Contents                                     |
| :---------------------------------------- | :------------------------------------------- |
| **[`📁 consumer`](./packages/consumer/)** | idOS JavaScript SDK for consumers            |
| **[`📁 issuer`](./packages/issuer)**      | idOS JavaScript SDK for issuers              |
| **[`📁 client`](./packages/client)**      | idOS JavaScript SDK for browser environments |

## Auxiliary Applications

| Folder                                                 | Contents                                                                                                            |
| :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| [`📁 idos-data-dashboard`](./apps/idos-data-dashboard) | Interface for users to visualize and manage their idOS profile. <br> Deployed at <https://dashboard.idos.network/>. |
| [`📁 idos-enclave`](./apps/idos-enclave)               | A secure browser context for password input, key derivation, encryption, and decryption.                            |

## Installation

Get [client NPM packages](https://www.npmjs.com/package/@idos-network/client) and [consumer NPM packages](https://www.npmjs.com/package/@idos-network/consumer) and its dependencies with pnpm or the equivalent of your package manager of choice:

```bash
pnpm add @idos-network/client @idos-network/consumer ethers near-api-js
```

## 10,000 foot view

```js
import { createIDOSClient, type idOSClient } from "@idos-network/client";

// Connect your user's wallet however you do it today, for example:
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

// Initialize the SDK
let idOSClient = createIDOSClient({
  enclaveOptions: { container: "#idOS-container" },
});
idOSClient = await idOSClient.withUserSigner(signer);

// Overview of user's credentials
const credentials = await idOSClient.getAllCredentials();
console.log(credentials);
// [{ id: "4f4d...", issuer: "Fractal ID", type: "KYC"}, ...]
```

More details on <https://github.com/idos-network/idos-sdk-js/tree/main/docs>.

## Developing

### Prerequisites

- [Node.js](https://nodejs.org/) (see [`.node_version`](.node_version) for the exact version)
- [pnpm](https://pnpm.io/) v10+ (enforced via the `packageManager` field in `package.json`)

### Setup

```bash
git clone https://github.com/idos-network/idos-sdk-js.git
cd idos-sdk-js
pnpm install
```

A pre-commit hook (via [Lefthook](https://github.com/evilmartians/lefthook)) is installed automatically on `pnpm install`. It runs formatting and linting on staged files before each commit.

### Common commands

| Command               | Description                               |
| :-------------------- | :---------------------------------------- |
| `pnpm dev`            | Start all apps in development mode        |
| `pnpm build`          | Build all packages and apps               |
| `pnpm build:packages` | Build only the packages under `packages/` |
| `pnpm test`           | Run unit tests                            |
| `pnpm typecheck`      | Run TypeScript type checking              |

### Code quality

Formatting is handled by [oxfmt](https://oxc.rs/docs/guide/usage/formatter) and linting by [oxlint](https://oxc.rs/docs/guide/usage/linter), both from the [Oxc](https://oxc.rs/) project.

| Command                  | Description                                 |
| :----------------------- | :------------------------------------------ |
| `pnpm format:fix`        | Format the codebase                         |
| `pnpm format`            | Check formatting (no writes)                |
| `pnpm lint:fix`          | Lint and auto-fix issues                    |
| `pnpm lint`              | Check for lint errors                       |
| `pnpm turbo run quality` | Run both format and lint checks in parallel |

## Releasing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing packages to npm. All `@idos-network/*` packages are versioned together (fixed versioning).

### Adding a changeset

When making changes to any package under `packages/`, add a changeset before opening your PR:

```bash
pnpm changeset
```

Follow the prompts to select the affected packages and the semver bump type (patch / minor / major). This creates a markdown file in `.changeset/` — commit it with your PR.

For PRs that don't need a release (tests, docs, tooling), run:

```bash
pnpm changeset --empty
```

CI will block PRs that touch packages without a changeset.

### Publishing

Publishing is fully automated:

1. When PRs with changesets are merged to `main`, a **"chore: update versions"** PR is automatically created (or updated) with bumped versions and changelogs.
2. Merging that PR publishes all packages to npm.

## License Inventory

License inventory workflow and local ORT usage are documented in
[`ort-config/README.md`](./ort-config/README.md).

## Support

Please follow the process outlined here: <https://github.com/idos-network/.github/blob/main/profile/README.md>
