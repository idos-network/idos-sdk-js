# idOS Consumer Server SDK

Server-side SDK for consuming (retrieving and verifying) user credentials from idOS. Designed for backend services that need to access user data after receiving access grants.

[![NPM](https://img.shields.io/npm/v/@idos-network/consumer?logo=npm)](https://www.npmjs.com/package/@idos-network/consumer) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

> ⚖️ Legalities
>
> By downloading, installing, or implementing any of the idOS' SDKs, you acknowledge that you have read and understood idOS' Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## Installation

```bash
pnpm add @idos-network/consumer
```

## Quick Start

```typescript
import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";

// Initialize with your signer and encryption key
const idOSConsumer = await idOSConsumerClass.init({
  consumerSigner,                    // Your signing keypair
  recipientEncryptionPrivateKey,     // Your encryption private key
});

// List access grants for a user
const { grants, totalCount } = await idOSConsumer.getAccessGrants({ user_id });

// Retrieve and decrypt credential content
const content = await idOSConsumer.getCredentialSharedContentDecrypted(grants[0].data_id);
```

## Documentation

For complete documentation, examples, and implementation guides:

- 📖 **[Consumer Guide](../../docs/guide-consumer.md)** - Comprehensive implementation guide
- 🏗️ **[System Overview](../../docs/README.md)** - Understanding idOS architecture
- 🔒 **[Encryption](../../docs/encryption.md)** - Encryption key management
- ✍️ **[Signatures](../../docs/signatures.md)** - Signer implementation details
- 💼 **[Passporting](../../docs/passporting.md)** - Credential passporting workflows

## Key Features

- **Access Grant Management** - List and verify access grants from users
- **Credential Retrieval** - Securely retrieve shared credentials
- **Automatic Decryption** - Built-in decryption of credential content
- **Multi-Chain Support** - Works with EVM, NEAR, XRPL, and Stellar signers
- **Credential Verification** - Verify W3C Verifiable Credentials signatures

## Support

Please follow the process outlined here: <https://github.com/idos-network/.github/blob/main/profile/README.md>
