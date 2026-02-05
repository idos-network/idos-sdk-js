# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

idOS JavaScript SDK is a monorepo containing SDKs and applications for the idOS decentralized identity system. idOS enables secure storage, verification, and sharing of personal data through blockchain technology with end-to-end encryption.

## Common Commands

```bash
# Install dependencies (pnpm is required)
pnpm install

# Build all packages and apps
pnpm build

# Build only packages (not apps)
pnpm build:packages

# Run in development mode with watch
pnpm dev

# Lint and format (uses Biome)
pnpm check           # Auto-fix issues
pnpm check:ci        # CI mode (no fixes)

# Type checking
pnpm typecheck

# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @idos-network/utils test
pnpm --filter @idos-network/credentials test

# Run a single test file
cd packages/utils && pnpm vitest run src/store/local.test.ts
```

## Architecture

### Public SDKs (Published to NPM)

- **`@idos-network/client`** - Browser SDK for dApps to integrate with idOS. Handles wallet connections, enclave communication, credential management, and access grants.
- **`@idos-network/consumer`** - Server SDK for consuming/retrieving user credentials after receiving access grants.
- **`@idos-network/issuer`** - Server SDK for issuing and managing credentials, creating user profiles.

### Internal Packages

- **`@idos-network/core`** - Shared utilities: cryptography, Kwil actions/infrastructure, signature verification for multiple chains (EVM, NEAR, XRPL, Stellar), and types.
- **`@idos-network/controllers`** - Web controllers for idOS web applications (enclave, isle).
- **`@idos-network/credentials`** - W3C Verifiable Credentials building and verification.
- **`@idos-network/utils`** - Encoding/decoding utilities, store abstractions.

### Applications

- **`idos-enclave`** - Secure browser context for encryption/decryption operations, isolated from host apps.
- **`idos-data-dashboard`** - User interface for managing idOS profiles, credentials, and access grants.
- **`dashboard-for-dapps`** - Tool for Consumer dApps to access shared user data.
- **`isle`** - Full-featured UI component for dApps to integrate idOS functionality.
- **`passporting-server`** - Backend service for credential passporting between entities.

### Key Concepts

- **Enclave**: A secure iframe-based environment that handles all encryption/decryption. Host apps never access plaintext credential data.
- **Access Grant**: User permission allowing a Consumer to access encrypted credential content.
- **Delegated Write Grant (dWG)**: Mechanism allowing issuers to create credentials on behalf of users.
- **Kwil**: The decentralized database platform underlying idOS storage nodes.

## Client State Machine

The client SDK uses a state machine pattern with these states:
1. `idOSClientConfiguration` - Initial configuration
2. `idOSClientIdle` - Client created, enclave loaded
3. `idOSClientWithUserSigner` - Wallet connected
4. `idOSClientLoggedIn` - User authenticated with profile access

## Multi-Chain Support

Signature verification and wallet support for:
- EVM (Ethereum, Polygon, etc.)
- NEAR Protocol
- XRP Ledger
- Stellar

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Build**: tsdown for packages, Vite for apps
- **Linting**: Biome (pre-commit hooks via lefthook)
- **Testing**: Vitest
- **Node version**: >=24.12.0

## Node URLs

- Production: `https://nodes.idos.network/`
- Playground: `https://nodes.playground.idos.network/`
