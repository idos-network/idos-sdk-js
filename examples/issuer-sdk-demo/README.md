# idOS Issuer SDK Demo

A demo application showcasing the "@idos-network/issuer-sdk-js" package.


## Getting started.

1. Clone the repository.
2. Install dependencies with `pnpm install`.
3. Create an `.env.local` file and add the following environment variables:

```
NEXT_PUBLIC_IDOS_NETWORK_API_KEY=<your-api-key>
# SDK SECRETS
NEXT_PUBLIC_KWIL_NODE_URL=<idOS-node-url>
NEXT_PUBLIC_ISSUER_ADDRESS=<issuer-address>

# WALLET PRIVATE KEY
NEXT_ISSUER_PRIVATE_KEY=<issuer-private-key>

# KEYPAIR
NEXT_ISSUER_SECRET_KEY=<issuer-secret-key>
NEXT_ISSUER_PUBLIC_KEY=<issuer-public-key>
```

4. Run the development server with `pnpm dev`.
