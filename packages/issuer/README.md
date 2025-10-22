# idOS Issuer JavaScript SDK

Server-side SDK for issuing and managing credentials in idOS. Designed for backend services that verify user identity and issue verifiable credentials.

[![NPM](https://img.shields.io/npm/v/@idos-network/issuer?logo=npm)](https://www.npmjs.com/package/@idos-network/issuer) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCiPjxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIj48L2c+PGcgaWQ9IlNWR1JlcG9fdHJhY2VyQ2FycmllciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48L2c+PGcgaWQ9IlNWR1JlcG9faWNvbkNhcnJpZXIiPiA8cGF0aCBkPSJNMTYgMTZsMy04IDMuMDAxIDhBNS4wMDIgNS4wMDIgMCAwMTE2IDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNMiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMiAxNnoiPjwvcGF0aD4gPHBhdGggZD0iTTcgMjFoMTAiPjwvcGF0aD4gPHBhdGggZD0iTTEyIDN2MTgiPjwvcGF0aD4gPHBhdGggZD0iTTMgN2gyYzIgMCA1LTEgNy0yIDIgMSA1IDIgNyAyaDIiPjwvcGF0aD4gPC9nPjwvc3ZnPgo=)

> ⚖️ Legalities
>
> By downloading, installing, or implementing any of the idOS' SDKs, you acknowledge that you have read and understood idOS' Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## Installation

```bash
pnpm add @idos-network/issuer
```

## Quick Start

```typescript
import { idOSIssuer as idOSIssuerClass } from "@idos-network/issuer";

// Initialize with your signing and encryption keys
const idOSIssuer = await idOSIssuerClass.init({
  nodeUrl: "https://nodes.idos.network",
  signingKeyPair,           // Your signing keypair
  encryptionSecretKey,      // Your encryption secret key
});

// Create a user profile
await idOSIssuer.createUser(user, wallet);

// Build and issue a W3C Verifiable Credential
const credential = await idOSIssuer.buildCredential(
  credentialFields,
  credentialSubject,
  issuer
);

// Write credential using delegated write grant
await idOSIssuer.createCredentialByDelegatedWriteGrant(
  credentialPayload,
  delegatedWriteGrant
);
```

## Documentation

For complete documentation, examples, and implementation guides:

- 📖 **[Issuer Guide](../../docs/guide-issuer.md)** - Comprehensive implementation guide
- 🏗️ **[System Overview](../../docs/README.md)** - Understanding idOS architecture
- 🔒 **[Encryption](../../docs/encryption.md)** - Encryption key management
- ✍️ **[Signatures](../../docs/signatures.md)** - Signer implementation details
- 💼 **[Passporting](../../docs/passporting.md)** - Credential passporting workflows

## Key Features

- **User Profile Creation** - Create and manage user profiles in idOS
- **Credential Issuance** - Issue W3C Verifiable Credentials
- **Delegated Write Grants** - Write credentials on behalf of users
- **Credential Management** - Edit and revoke issued credentials
- **Multi-Chain Support** - Works with EVM, NEAR, XRPL, and Stellar wallets
- **Schema Validation** - Optional validation against W3C VC schemas

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
