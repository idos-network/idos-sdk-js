---
"@idos-network/kwil-infra": major
"@idos-network/client": major
"@idos-network/consumer": major
---

Replace the shape-guessing signer dispatcher with explicit per-backend signer creation.

**Breaking changes:**

- `@idos-network/kwil-infra`: removed `createServerKwilSigner`, `createClientKwilSigner`, the `Wallet`/`KwilSignerType`/`CustomKwilSigner` erased union types, and all the `is*`/`looksLike*` type guards. Replaced with explicit functions that take a concrete wallet type and no longer need to guess: `createNaclKwilSigner`, `createNearKeyPairKwilSigner`, `createStellarKwilSigner`, `createXrplKeyPairKwilSigner`, `createEthersWalletKwilSigner` (server), and `createEvmKwilSigner`, `createNearWalletKwilSigner`, `createXrpKwilSigner`, `createFaceSignKwilSigner`, `createMmTokenKwilSignerResult` (browser). All browser adapters return the same `ClientKwilSignerResult` shape.
- `@idos-network/client`: `idOSClientIdle.withUserSigner(wallet)` is replaced by explicit methods — `withEvmSigner`, `withNearWallet`, `withXrpWallet`, `withFaceSignSigner`, `withMmToken`, and a `withKwilSigner` escape hatch for hand-built signers (e.g. Stellar).
- `@idos-network/consumer`: `idOSConsumerConfig.consumerSigner` now expects an already-built `KwilSigner` (e.g. from `createNaclKwilSigner`) instead of raw key material, and requires a new `consumerAddress` field.

`@idos-network/issuer`'s public API is unchanged.
