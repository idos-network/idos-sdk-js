<!-- cSpell:words ECIES xsalsa20 -->
# Encryption

The idOS uses **authenticated asymmetric encryption**. Encryption being **asymmetric** means that Alice can encrypt a message for Bob (and vice versa) without them having to previously agree on a shared encryption key. It being **authenticated** guarantees message authenticity and integrity, each property respectively assuring Bob that the message was indeed encrypted by Alice and wasn’t tampered with.

![idOS asymmetric encryption diagram](assets/idos-asymmetric-encryption.svg)

To do this, we employ `x25519-xsalsa20-poly1305`: a modern and proven [ECIES Hybrid Encryption Scheme](https://cryptobook.nakov.com/asymmetric-key-ciphers/ecies-public-key-encryption). The idOS Enclave includes [tweetnacl](https://github.com/dchest/tweetnacl-js), a famous implementation of this scheme. Let’s break it down and see what it means.

Say Alice wants to encrypt a message for Bob. To do this, she needs 3 things: the **message**, her **private** key, and Bob’s **public** key.

1. First, we use these **private** and **public** keys, together with a nonce, to compute a unique shared secret. It does this using the `x25519` [ECDH](https://cryptobook.nakov.com/asymmetric-key-ciphers/ecdh-key-exchange) function, a key agreement algorithm based on the `Curve25519` elliptic curve.
2. We then use this shared secret to encrypt the **message** with the `xsalsa20` symmetric stream cipher. This is an algorithm used to symmetrically encrypt data of arbitrary size.
3. Finally, we calculate a message authentication code (a [MAC](https://en.wikipedia.org/wiki/Message_authentication_code)) using the `poly1305` algorithm. This MAC is sent along with the encrypted message and can be used to verify that it wasn’t tampered with.

To decrypt and authenticate the resulting ciphertext, Bob does a mirror version of this process to obtain the original **message**.

## Ephemeral keys

Note that from an access control perspective, in the context of Access Grants, data in idOS is not actually shared. That is, an encrypted credential in idOS is never accessible for two distinct partners (e.g. Issuer and Owner) — instead, an encrypted copy of the "shared" data is created for each Access Grant.

The encryption scheme described above makes it possible for the sender — not just the receiver — of an encrypted message to also decrypt it. While informationally speaking this doesn't affect security (since the sender had, by definition, access to the encrypted message), we chose to be stricter here: our SDKs always encrypt data using an ephemeral private key.

This ensures that, if an Issuer leaks its private encryption key, the credentials they encrypted for users can't be decrypted with that key even if accessed.
