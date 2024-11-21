# idOS SumSub provider demo

A demo application showcasing the "@idos-network/issuer-sdk-js" package.


## Getting started.

1. Clone the repository.
2. Install dependencies with `pnpm install`.
3. Create an `.env.local` file and add the following environment variables:

```
BASE_URL=<your-base-url>
DATABASE_URL=<your-postgresql-database-url>
NEXT_PUBLIC_WALLET_CONNECT_ID=<wallet-connect-id>

# SumSub configurations
SUM_SUB_API_KEY=
SUM_SUB_SECRET_KEY=
SUM_SUB_WEBHOOK_SECRET_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Wallet private key
NEXT_ISSUER_PRIVATE_KEY=

# Issuer (provider keys)
NEXT_ISSUER_SECRET_KEY=
```

4. Run the development server with `pnpm dev`.
