---
"@idos-network/kwil-infra": major
"@idos-network/client": major
"@idos-network/consumer": major
"@idos-network/issuer": major
---

Remove the `mm_token` Kwil signer. KGW and kwild no longer accept MetaMask UKYC storage tokens as a login; MM users are now managed only by an MM operator (`idOSMmOperator` in `@idos-network/issuer`).

- `@idos-network/kwil-infra`: removed `createMmTokenAuth`, `isMmTokenAuth`, `mmTokenStorageId` and the `MmTokenAuth`, `MmTokenEnvelope`, `MmTokenPayload` types; `Wallet` and `KwilSignerType` no longer include `MmTokenAuth`. `createKgwAuthenticatedBlobGateway` takes `accessToken?: string` (a UKYC storage token) instead of `mmAuth`. The KGW-authenticated fetch no longer re-logs in when blob-gateway rejects a storage token (`401 MM_TOKEN_INVALID` / `MM_TOKEN_EXPIRED`).
- Regenerated actions: new `getUserAsMmOperator`, `createUserAsMmOperator`, `getCredentialsAsMmOperator`, `createPreliminaryCredentialAsMmOperator`, `requestUserWipeAsMmOperator`, each taking the user's UKYC storage token as `storage_token`. `upsertWalletAsInserter` no longer accepts `wallet_type: "MM"` (`AddWalletType`), and `not_before` / `not_after` are required again.
- `@idos-network/client`: an `MmTokenAuth` is no longer a valid signer, and the client never creates `ukyc://` credentials. `removeCredential` rejects `ukyc://` credentials: they go only with a full data wipe.
- `@idos-network/consumer`: removed `mmAuth` from `idOSConsumer.init`. `rescindSharedCredential` rejects `ukyc://` credentials before calling Kwil.
- `@idos-network/issuer`: `CredentialByDelegatedWriteGrantBaseParams` no longer has `ukycStorageId`; delegated write grants can't write for MM users.
