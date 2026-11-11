---
"@idos-network/utils": minor
"@idos-network/credentials": minor
"@idos-network/kwil-infra": minor
"@idos-network/client": patch
"@idos-network/issuer": patch
"@idos-network/mm-operator": patch
---

Build the credential `broader_signature` message locally instead of asking the node for it. The issuer key signed whatever text `credential_broader_message` returned, so a lying node could pick the recipient or get arbitrary text signed. `@idos-network/client`, `@idos-network/issuer` and `@idos-network/mm-operator` no longer call that action.

New: `prepareCredentialBroaderMessage` and `localCredentialBroaderMessageFor(recipientWallet, chainId)` in `@idos-network/credentials/utils` (byte for byte equal to idos-kwild's `PrepareCredentialBroaderMessage`), `toChecksumAddress` (EIP-55) in `@idos-network/utils/codecs`, and `KwilActionClient.chainId`. If you pass your own `broaderMessageFor`, switch to `localCredentialBroaderMessageFor`; don't sign text fetched from the network.
