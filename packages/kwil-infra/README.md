# idOS Kwil Infra

> ⚖️ Legalities
>
> By downloading, installing, or implementing any of the idOS’ SDKs, you acknowledge that you have read and understood idOS’ Privacy Policy and Transparency Document.
>
> - <https://www.idos.network/legal/privacy-policy>
> - <https://www.idos.network/legal/transparency-document>

## Developing locally

```bash
pnpm build
```

## Overview

`@idos-network/kwil-infra` provides the building blocks for interacting with the idOS Kwil
infrastructure. It includes:

- Typed action helpers generated from the Kwil schema.
- Client helpers to `call` and `execute` actions.
- Signer helpers for EVM, NEAR, Stellar, XRPL, and custom signers.
- Signature verification utilities across supported wallet types.
- XRPL wallet helpers (Xumm, GemWallet).

## Install

```bash
pnpm add @idos-network/kwil-infra
```

Some features require optional peer dependencies:

- `@wagmi/core` (EVM)
- `near-api-js`, `@hot-labs/near-connect` (NEAR)
- `@stellar/stellar-sdk` (Stellar)
- `ripple-keypairs` (XRPL)

## Create a Kwil client

```ts
import { createNodeKwilClient } from "@idos-network/kwil-infra";

const kwil = await createNodeKwilClient({
  nodeUrl: "https://kwil.your-node.example",
});
```

## Run actions

```ts
import { addWallet } from "@idos-network/kwil-infra/actions";

await addWallet(kwil, {
  id: "00000000-0000-0000-0000-000000000000",
  address: "0xabc...",
  public_key: null,
  wallet_type: "EVM",
  message: "Sign this message",
  signature: "0xsignature",
});
```
