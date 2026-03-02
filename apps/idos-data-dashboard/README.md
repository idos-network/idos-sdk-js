# idOS Data Dashboard

[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=idos-data-dashboard)](https://idos-data-dashboard.vercel.app) ![License](https://img.shields.io/badge/license-MIT-blue)

Source for the idOS data dashboard hosted at [dashboard.idos.network](https://dashboard.idos.network).

## Overview

The idOS Data Dashboard is a web application that allows users to manage their decentralized identity data stored on the [idOS](https://idos.network). Through the dashboard, users can:

- **View and manage credentials** -- Browse issued credentials, inspect their metadata, and delete them.
- **Manage access grants** -- See which third parties have been granted access to credentials and revoke grants.
- **Add and remove wallets** -- Link additional wallet addresses to an idOS profile or remove existing ones.
- **Connect with multiple chains** -- Authenticate using EVM (Ethereum, etc.), NEAR, Stellar, or XRPL wallets.
- **Biometric authentication** -- Connect via FaceSign, an iframe-embedded biometric signer powered by FaceTec.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v10+ (this is a pnpm workspace monorepo)
- A [WalletConnect](https://cloud.reown.com/) project ID from Reown

## Getting started

1. **Clone the monorepo** and install dependencies from the root:

   ```bash
   git clone https://github.com/idos-network/idos-sdk-js.git
   cd idos-sdk-js
   pnpm install
   ```

2. **Create an environment file** at `apps/idos-data-dashboard/.env.local`:

   ```env
   VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
   VITE_IDOS_NODE_URL=https://nodes.idos.network
   VITE_IDOS_ENCLAVE_URL=https://enclave.idos.network
   VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID=idos.near
   VITE_EMBEDDED_WALLET_APP_URLS=https://dashboard.idos.network/add-wallet
   VITE_FACESIGN_ENCLAVE_URL=https://localhost:5174
   ```

3. **Start the development server**:

   ```bash
   pnpm dev
   ```

   The app will be available at `https://localhost:5173` (HTTPS via `mkcert`).

### FaceSign development setup

To use FaceSign locally, the FaceSign enclave must be running alongside the dashboard:

1. **Start the FaceSign enclave** in a separate terminal:

   ```bash
   pnpm --filter facesign-enclave dev
   ```

   The enclave runs at `https://localhost:5174` by default (the next available port after the dashboard).

2. **Ensure `VITE_FACESIGN_ENCLAVE_URL`** in the dashboard's `.env.local` points to the enclave URL (`https://localhost:5174`).

3. **Configure the enclave's allowed origins** in `apps/facesign-enclave/.env.local`:

   ```env
   VITE_ALLOWED_ORIGINS="*"
   ```

   In production, restrict this to the dashboard's actual origin.

Both apps must run over HTTPS (handled automatically by `mkcert`).

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_WALLET_CONNECT_PROJECT_ID` | Yes | Reown (WalletConnect) project ID for EVM wallet connections. |
| `VITE_IDOS_NODE_URL` | Yes | URL of the idOS node the client connects to. |
| `VITE_IDOS_ENCLAVE_URL` | Yes | URL of the idOS secure enclave for credential decryption. |
| `VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID` | Yes | NEAR contract ID for the idOS access grants contract. |
| `VITE_EMBEDDED_WALLET_APP_URLS` | Yes | Comma-separated URLs for the embedded wallet add flow popup. |
| `VITE_FACESIGN_ENCLAVE_URL` | No | URL of the FaceSign enclave for biometric authentication. |

## Available scripts

Run these from the `apps/idos-data-dashboard` directory:

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Vite development server with HMR and HTTPS. |
| `pnpm build` | Type-check with `tsc` and produce a production build. |
| `pnpm preview` | Serve the production build locally for inspection. |
| `pnpm typecheck` | Run the TypeScript compiler in `--noEmit` mode. |

## Architecture

The application separates concerns into three layers:

```text
XState (auth & wallet state)
    |
    v
TanStack Router (file-based routing with loaders)
    |
    v
TanStack Query (server state & caching)
    |
    v
idOS Client SDK (data access)
```

### Boot flow

1. **`main.tsx`** renders an `<App />` component wrapped in `WagmiProvider` and `QueryClientProvider`.
2. The `<App />` component reads the XState `dashboardActor` state via selectors:
   - **Loading** (idle, reconnecting, initializing) -- shows a spinner.
   - **Disconnected** -- shows the wallet connection screen.
   - **No profile** -- shows a "no account found" message.
   - **Logged in** -- mounts `<RouterProvider>` with the authenticated `idOSClient` in the router context.
3. Because the router only mounts after authentication, all route loaders are guaranteed to have a valid `idOSClient` -- no auth guards are needed in individual routes.

### State machine

The XState `dashboardMachine` manages the full wallet lifecycle:

```text
idle --> reconnecting --> initializingIdOS --> loggedIn
  \                                       \-> noProfile
   \-> disconnected --> connecting --> initializingIdOS
```

It handles wallet connection, reconnection from `localStorage`, idOS client initialization, and disconnection across all supported chains (EVM, NEAR, Stellar, XRPL, and FaceSign).

## Project structure

```text
src/
├── machines/               # XState state machine
│   ├── actors/             # Actor implementations (connect, disconnect, reconnect, init)
│   ├── dashboard.machine.ts  # Machine definition (states, events, context)
│   ├── dashboard.actor.ts  # Actor instantiation
│   └── selectors.ts        # Snapshot selectors for UI consumption
│
├── routes/                 # TanStack Router (file-based)
│   ├── __root.tsx          # Root route (layout + devtools)
│   ├── index.tsx           # Credentials page (default route)
│   ├── wallets.tsx         # Wallets page
│   └── settings.tsx        # Settings page
│
├── components/             # React components
│   ├── credentials/        # Credential cards, details, grants, delete dialogs
│   ├── wallets/            # Wallet cards, add/delete flows
│   ├── ui/                 # Reusable UI primitives (shadcn/ui style)
│   ├── layout.tsx          # Sidebar, mobile drawer, breadcrumbs
│   └── error-card.tsx      # Error boundary component
│
├── core/                   # Wallet SDK setup and signer factories
│   ├── wagmi.ts            # EVM: Reown AppKit + Wagmi adapter
│   ├── near.ts             # NEAR: wallet-selector singleton
│   ├── stellar-kit.ts      # Stellar: stellar-wallets-kit config
│   ├── signers.ts          # Signer factory functions per chain
│   └── idOS.tsx            # idOS client accessor hook
│
├── lib/                    # Utilities, queries, and mutations
│   ├── queries/            # TanStack Query query options (credentials, wallets)
│   ├── mutations/          # TanStack Query mutations (CRUD operations)
│   ├── utils.ts            # Class name merging (cn)
│   └── time.ts             # Time conversion utilities
│
├── hooks/                  # Custom React hooks
│   └── use-disclosure.ts   # Open/close state for modals and drawers
│
├── styles/
│   └── index.css           # Global styles and Tailwind imports
│
├── main.tsx                # Entry point (providers, conditional rendering)
├── connect-wallet.tsx      # Wallet connection screen
└── query-client.ts         # TanStack Query client instance
```

## Tech stack

- **React** -- UI rendering.
- **TypeScript** -- Type safety across the entire codebase.
- **Vite** -- Build tool with HMR, SWC, and code splitting.
- **XState v5** -- Finite state machine for wallet and authentication lifecycle.
- **TanStack Router** -- File-based routing with loaders and `Suspense` integration.
- **TanStack Query** -- Server state management, caching, and `useSuspenseQuery`.
- **Tailwind CSS v4** -- Utility-first styling.
- **shadcn/ui** -- Accessible, composable UI primitives (Button, Dialog, Drawer, Badge, etc.).
- **idOS Client SDK** (`@idos-network/client`) -- Reads and manages decentralized identity data.
- **Reown AppKit + Wagmi** -- EVM wallet connections via WalletConnect.
- **NEAR wallet-selector** -- NEAR wallet integration (Meteor, Here Wallet).
- **Stellar Wallets Kit** -- Stellar wallet connections.
- **GemWallet** -- XRPL wallet connections.

## Multi-chain wallet support

| Chain | SDK | Loaded |
| --- | --- | --- |
| EVM (Ethereum, etc.) | Reown AppKit + Wagmi | Eagerly (WagmiProvider wraps the app) |
| NEAR | `@near-wallet-selector` | Lazily (dynamic `import()`) |
| Stellar | `@creit.tech/stellar-wallets-kit` | Lazily (dynamic `import()`) |
| XRPL | `@gemwallet/api` | Lazily (dynamic `import()`) |
| FaceSign | `@idos-network/kwil-infra/facesign` | Lazily (dynamic `import()`) |

Non-EVM wallet SDKs are dynamically imported only when the user selects that chain, keeping the initial bundle small. FaceSign embeds the enclave as a fullscreen iframe and communicates via `postMessage`.

## Bundle optimization

The Vite config uses a `manualChunks` function to split the production bundle into logical pieces:

- **`react`** -- React core.
- **`wagmi`** -- EVM stack (Reown, Wagmi, Viem) -- always loaded.
- **`tanstack-router`** / **`tanstack-query`** -- Routing and data fetching.
- **`xstate`** -- State machine runtime.
- **`ethers`**, **`near`**, **`stellar`**, **`xrpl`** -- Chain-specific SDKs, loaded on demand.
- **`icons`** -- Lucide icons.

Non-EVM signer and SDK code uses `import()` in actor and signer files so Rollup can tree-shake and code-split them into separate chunks that are only fetched when needed.

## Deployment

Both the dashboard and the FaceSign enclave are hosted on [Vercel](https://vercel.com) and auto-deploy from the `main` branch.

| App | Production URL |
| --- | --- |
| Dashboard | [dashboard.idos.network](https://dashboard.idos.network) |
| FaceSign enclave | [facesign-enclave.idos.network](https://facesign-enclave.idos.network) |

### Vercel environment variables

When deploying, set the following environment variables in each Vercel project:

**Dashboard** (`idos-data-dashboard`):

| Variable | Value |
| --- | --- |
| `VITE_WALLET_CONNECT_PROJECT_ID` | Your Reown (WalletConnect) project ID |
| `VITE_IDOS_NODE_URL` | `https://nodes.idos.network` |
| `VITE_IDOS_ENCLAVE_URL` | `https://enclave.idos.network` |
| `VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID` | `idos.near` |
| `VITE_EMBEDDED_WALLET_APP_URLS` | `https://dashboard.idos.network/add-wallet` |
| `VITE_FACESIGN_ENCLAVE_URL` | `https://facesign-enclave.idos.network` |

**FaceSign enclave** (`facesign-enclave`):

| Variable | Value |
| --- | --- |
| `VITE_FACESIGN_SERVICE_URL` | FaceSign service endpoint |
| `VITE_ENTROPY_SERVICE_URL` | Entropy service endpoint |
| `VITE_FACETEC_DEVICE_KEY_IDENTIFIER` | FaceTec device key |
| `VITE_FACETEC_IFRAME_FEATURE_FLAG` | FaceTec iframe feature flag UUID |
| `VITE_ALLOWED_ORIGINS` | `https://dashboard.idos.network` (comma-separated for multiple) |

**Embedded wallet** (`embedded-wallet`):

| Variable | Value |
| --- | --- |
| `VITE_DATA_DASHBOARD_URL` | `https://dashboard.idos.network` |
| `VITE_FACESIGN_ENCLAVE_URL` | `https://facesign-enclave.idos.network` |
| `VITE_WALLET_CONNECT_PROJECT_ID` | Your Reown (WalletConnect) project ID |

The `VITE_ALLOWED_ORIGINS` variable on the enclave must list every origin that is permitted to embed it (including the embedded-wallet origin if it is hosted separately). In production, never use `"*"`.

## License

MIT
