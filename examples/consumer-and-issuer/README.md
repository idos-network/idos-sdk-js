# idOS Consumer and Issuer SDK Demo

This app demonstrates the process of credential management using the idOS consumer and issuer SDK. It allows users to create, manage, and share credentials securely. The app supports creating credentials via permissioned issuers, write grants, and reusable credentials. It also provides a user-friendly interface to list and refresh credentials.

### Features

TBD

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## Client-Side Implementation

TBD

### Environment Variables

- `NEXT_PUBLIC_KWIL_NODE_URL`: URL of the idOS node.
- `NEXT_PUBLIC_ISSUER_PUBLIC_KEY_HEX`: Public Signing key for the issuer (hex encoded).
- `NEXT_ISSUER_SIGNING_SECRET_KEY`: Signing secret key for the issuer.
- `NEXT_ISSUER_ENCRYPTION_SECRET_KEY`: Encryption secret key for the issuer.
