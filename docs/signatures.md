# Wallets/signers and signature schemes

Supported by the SDK, and verifiable for auth with the idOS network:

- EVM wallets
    - producing [EIP-191](https://eips.ethereum.org/EIPS/eip-191) `secp256k1` signatures (aka `personal_sign`)
    - e.g. MetaMask, Rainbow, Rabby
- NEAR wallets
    - producing [NEP-413](https://github.com/near/NEPs/blob/master/neps/nep-0413.md) `ed25519` signatures (aka `signMessage`)
    - e.g. Meteor, Sender, MyNearWallet
- arbitrary signers
    - producing vanilla `ed25519` signatures (for Issuers only)
    - e.g. https://github.com/dchest/tweetnacl-js
