# idOS JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Run `yarn add @idos-network/idos-sdk` or `npm install @idos-network/idos-sdk` to install [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk).

## Quickstart

```js
import { idOS } from "@idos-network/idos-sdk";

// initialize SDK
const idos = new idOS({ url: "..." });
await idos.auth.setWeb3Signer(connectedSigner);
await idos.crypto.init();

// read data from the connected user's idOS profile
const credentials = await idos.data.list("credentials");

// write data to the connected user's idOS profile
const attribute = await idos.data.create("attributes", { key: "foo", value: "bar" });

// get an access grant (read data later, offline, without needing the user's signature)
await idos.grants.create(attribute, { address: "0xYou", encryptionPublicKey: "0xYours" });
```

See the more complete example at at [examples/dapp](../examples/dapp/).

## "Types"

```
Record
{ id: string }

    > Attribute
    { humanId: string, key: string, value: string }

    > Wallet
    { humanId: string, address: string, message: string, signature: string }

    > Credential
    { humanId: string, type: string, issuer: string, content: string }

Profile
{ humanId: string, address: string }

Grantee
{ address: string, publicKey: string }

Grant
{ from: string, to: Grantee, dataId: string, lockedUntil: uint32 }

GrantCreate
{ grant: Grant, encryptedWith: string, transactionId: string }

GrantRevoke
{ grants: Grant[], transactionId: string }

CredentialIssuer
{ name: string, publicKey: string }

CryptoOptions
{ skipEncryption: string[] }
```

## Interface

```
idos = new idOS({ url })

idos.auth.

    setWeb3Signer({ address, signFn }) -> null

    currentUser() -> Promise{ Profile }

idos.crypto.

    init() -> Promise{ string }

idos.data.

    list(tableName, Record?) -> Promise{ Record[] }

    get(Record{ id }) -> Promise{ Record }

    create(tableName, Record, CryptoOptions?) -> Promise{ Record }

    update(Record{ id }, Record, CryptoOptions?) -> Promise{ Record }

    delete(Record{ id }) -> Promise{ Record }

idos.grants.

    list(
        Profile{ address }?, Grantee{ address }?, Record{ id: dataId }?
    ) -> Promise{ Grant[] }

    create(
	Grantee{ address }, Record{ id }?, Grant{ lockedUntil }?
    ) -> Promise{ GrantCreate }

    revoke(
        Grantee{ address }, Record{ id }?, Grant{ lockedUntil }?
    ) -> Promise{ GrantRevoke }

idos.utils.

    validateCredential(
        Credential{ content, issuer? }, CredentialIssuer?,
    ) -> boolean
```
