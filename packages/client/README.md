# idOS Client JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/client?logo=npm)](https://www.npmjs.com/package/@idos-network/client) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

> ⚖️ Legalities
>
> By downloading, installing, or implementing any of the idOS’ SDKs, you acknowledge that you have read and understood idOS’ Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/client) and its dependencies with pnpm or the equivalent of your package manager of choice:

```bash
pnpm add @idos-network/client
```

## Quick start

```typescript
import {
  createIDOSClient,
  idOSClientLoggedIn,
  type idOSClientWithUserSigner,
} from "@idos-network/client";

const idOSClientWithoutSigner = await createIDOSClient({
  nodeUrl: "https://nodes.idos.network",
  enclaveOptions: {
    container: "#idosContainer",
  },
}).createClient();

// Signer can be JsonRpcSigner, or check below for supported chains
const idOSClientWithSigner = await idOSClientWithoutSigner.withUserSigner(signer);

// Check if user is already in idOS onboarded
const hasProfile = await store.idOSClient.hasProfile();

// If yes we can create a new session
const loggedInClient = await store.idOSClient.logIn();

// User id and public encryption key
const profile = loggedInClient.user;

// Now we can filer over users credentials (no access to them)
const credentials = await loggedInClient.filterCredentials({
  credentialLevelOrHigherFilter: {
    userLevel: "basic",
    requiredAddons: ["email", "liveness"],
  },
});

// If we found a credentials which we can use, we will ask user for AccessGrant
// which we later can use in our consumer to get the users data
const ag = await loggedInClient.requestAccessGrant(credentials.id, {
  consumerAuthPublicKey: "CONSUMER_PUBLIC_KEY",
  consumerEncryptionPublicKey: "CONSUMER_ENC_PUBLIC_KEY",
  lockedUntil: (Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000, // 3 months from now
});

// Also when the user is logged in, we can ask him to add another wallet
// wallet type is required.
await loggedInClient.addWallet({
  id: "unique-wallet-id",
  address: "0x...", // Wallet address
  public_key: "0x...", // Public key in hex format
  message: "Sign this message to prove you own this wallet",
  signature: "0x...", // Signature of the message
  wallet_type: "EVM", // Required: "EVM", "NEAR", "XRPL"...
});
```

### Supported Wallet Types

- `"evm"` - Ethereum Virtual Machine compatible wallets (Ethereum, Polygon, etc.)
- `"xrpl"` - XRP Ledger wallets
- `"near"` - NEAR Protocol wallets
- `"stellar"` - Stellar network wallets

## Documentation

For complete documentation, examples, and implementation guides:

- 📖 **[Client Guide](../../docs/guide-client.md)** - Comprehensive implementation guide
- 🏗️ **[System Overview](../../docs/README.md)** - Understanding idOS architecture
- 🔒 **[Encryption](../../docs/encryption.md)** - Encryption key management
- ✍️ **[Signatures](../../docs/signatures.md)** - Signer implementation details

## Key Features

- **Profile & Session Lifecycle** - Check profile existence, attach a wallet signer, and log users in/out
- **Enclave-Backed Encryption** - Generate user encryption profiles and decrypt credential content safely via the enclave
- **Credential Access & Filtering** - Fetch credentials, read decrypted content, and filter by issuer, level, and field rules
- **Credential Sharing Flows** - Request DAG/DWG messages, create access grants, and share credentials with controlled lock times
- **Wallet Management** - Add, list, and remove wallets (single or batch), including MPC-aware wallet synchronization
- **Multi-Chain Wallet Support** - Works with EVM, NEAR, XRPL, and Stellar wallet types

## Support

Please follow the process outlined here: <https://github.com/idos-network/.github/blob/main/profile/README.md>

---

## Developing the SDK locally

Run:

```bash
pnpm dev
```

This will start the compiler in watch mode that will rebuild every time any of the source files are changed.

You can also create a production build by running the following command in the root folder of the SDK package:

```bash
pnpm build
```
