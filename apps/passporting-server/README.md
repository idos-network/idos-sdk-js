# idOS Passporting Server

## Overview
idOS Passporting Service provides an endpoint for inserting delegated access grants into the idOS system. This service represents Obligated Entity 1 (OE1), which originally issued a credential to a user. Another entity, Obligated Entity 2 (OE2), can use this service to request access to that credential by creating an access grant.

The core logic is implemented at [src/core.ts](./src/core.ts).

## Features
- Validates incoming requests with a structured schema.
- Authenticates requests using bearer tokens.
- Transmits Delegated Access Grant (DAG) data to idOS.
- Ensures security with key-based cryptographic operations.

## Running the Service
1. Set the following environment variables:
   - `KWIL_NODE_URL`: URL of the idOS node.
   - `ISSUER_SIGNING_SECRET_KEY`: Issuer signing secret key.
   - `ISSUER_ENCRYPTION_SECRET_KEY`: Issuer encryption secret key.
   - `CLIENT_SECRETS`: Comma-separated list of valid bearer tokens.
2. Start the service with:
   - `pnpm run dev`: develop locally, with --watch
   - `pnpm run start`: designed to be used with Vercel
   - `pnpm run start:node`: designed to be used with node.js
3. Access the service at `http://localhost:3000` (or at your server).
