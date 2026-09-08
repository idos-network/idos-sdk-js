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
- Signer helpers for EVM, NEAR, Stellar, XRPL, MM token (`mm_token`), and custom signers.
- Signature verification utilities across supported wallet types.
- XRPL wallet helpers (Xumm, GemWallet).

## Install

```bash
pnpm add @idos-network/kwil-infra
```

Some features require optional peer dependencies:

- `viem` (EVM)
- `near-api-js`, `@near-wallet-selector/core` (NEAR)
- `@stellar/stellar-sdk` (Stellar)
- `ripple-keypairs`, `xrpl` (XRPL)

## Create a Kwil client

```ts
import { createNodeKwilClient } from "@idos-network/kwil-infra";

const kwil = await createNodeKwilClient({
  nodeUrl: "https://kwil.your-node.example",
});
```

## Authenticate with an MM (MetaMask UKYC) token

KGW `mm_token` auth expects a **base64url-encoded** envelope string — not raw JSON.
Decoded shape:

```json
{
  "payload": { "version": 1, "aud": "...", "signing_public_key": "...", "...": "..." },
  "signature": "base64url(ed25519-signature-over-canonical-payload)"
}
```

```ts
import { createMmTokenAuth, createNodeKwilClient } from "@idos-network/kwil-infra";
import { getCredentials } from "@idos-network/kwil-infra/actions";

const kwil = await createNodeKwilClient({
  nodeUrl: "https://kwil.your-node.example",
});

// MetaMask / UKYC issues this as a single base64url string.
const encodedMmToken =
  "eyJwYXlsb2FkIjp7InZlcnNpb24iOjEsImF1ZCI6Im1ldGFtYXNrOnVzZXItc3RvcmFnZTp1a3ljIiwiLi4uIjpudWxsfSwic2lnbmF0dXJlIjoiLi4uIn0";

const mmAuth = createMmTokenAuth(encodedMmToken);
kwil.setSigner(mmAuth);

await getCredentials(kwil);
```

`createMmTokenAuth` also accepts a decoded `{ payload, signature }` object and
re-encodes it. Prefer the encoded string from MetaMask so `signMessage` preserves the
exact bytes KGW will verify.

The returned object is one capability with two uses: it is a valid `KwilSigner` for KGW,
and it carries the encoded envelope as `accessToken` for UKYC blob requests. Pass it to
`client.withUserSigner()` or `idOSConsumer.init({ consumerSigner })` and the blob gateway
picks up that authorization automatically — never pass the raw token separately. A consumer
signing with a non-MM key can still read capability-authorized UKYC blobs by passing the
same object as `mmAuth`.

Note: `mm_token` callers cannot `add_wallet` / `remove_wallet` — MM wallets are inserted
by a trusted issuer (`wallet_type: "MM"`, with `address` and `public_key` both set to
`payload.signing_public_key`).

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
