# idOS JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) with `pnpm add @idos-network/idos-sdk` (or the equivalent of your package manager of choice).

## Quickstart

```js
import { idOS } from "@idos-network/idos-sdk";

// initialize SDK
const idos = idOS.init({ container: "#idos" });
await idos.auth.setEvmSigner(connectedSigner);
await idos.crypto.init();

// read data from the connected user's idOS profile
const credentials = await idos.data.list("credentials");

// write data to the connected user's idOS profile
const attribute = await idos.data.create("attributes", {
  attribute_key: "foo",
  value: "bar",
});
```

See the more complete example at at [apps/idos-example-dapp](../../apps/idos-example-dapp).

## "Types"

```
CustomSigner
function(string) => { signature: string }

Signer
ethers.Signer | CustomSigner

Address
evmAddress | nearAddress

NearWallet
nearApiJs.Account

EncryptionPublicKey
{ base64: string, raw: uint8[] }

TableName
string

Record
{ id: string }

    > Attribute
    { humanId: string, key: string, value: string }

    > Wallet
    { humanId: string, address: string, message: string, signature: string, publicKey: string }

    > Credential
    { humanId: string, type: string, issuer: string, content: string }

Profile
{ humanId: string, address: string }

Grant
{ owner: Address, grantee: Address, dataId: string, lockedUntil: uint32 }

CredentialIssuer
{ name: string, publicKey: string }

CryptoOptions
{ skipEncryption: string[] }
```

## Interface

```
idos = idOS.init({
    container: cssSelector,
    url: nodeUrl?,
})

idos.auth.

    setEvmSigner(
        ethers.Signer,
    ) -> null

    setNearSigner(
        WalletSelector.Wallet,
    ) -> null

    currentUser(
    ) -> Promise{ Profile }

idos.crypto.

    init(
    ) -> Promise{ EncryptionPublicKey }

idos.data.

    list(
        TableName,
        Record?,
    ) -> Promise{ Record[] }

    get(
        TableName,
        id = Record.id,
    ) -> Promise{ Record }

    create(
        TableName,
        Record,
        EncryptionPublicKey.base64?,
        CryptoOptions?,
    ) -> Promise{ Record }

    share(
        TableName,
        Record.id,
        Record'.id,
    ) -> Promise{ { id: Record'.id } )

    update(
        TableName,
        Record{ id },
        CryptoOptions?,
    ) -> Promise{ Record }

    delete(
        TableName,
        id = Record{ id },
    ) -> Promise{ Record }

idos.grants.

    init({
        type: "evm",
        signer: ethers.Signer,
    }) -> null

    init({
        type: "near",
        accountId: nearAddress,
        wallet: NearWallet,
        contractId?: nearAddress,
    }) -> null

    list({
        owner: Grant.owner?,
        grantee: Grant.grantee?,
        dataId: Grant.dataId?,
    }) -> Promise{ Grant[] }

    create({
        grantee: Grant.grantee,
        dataId: Grant.dataId,
        lockedUntil: Grant.lockedUntil?,
        wait: boolean?,
    }) -> Promise{ { transactionId: string } }

    revoke({
        grantee: Grant.grantee,
        dataId: Grant.dataId,
        lockedUntil: Grant.lockedUntil?,
        wait: boolean?,
    }) -> Promise{ { transactionId: string } }

    near.contractMethods -> string[]

idos.utils.

    validateCredential(
        Credential{ content, issuer? },
        CredentialIssuer{ publicKey, name? }?,
    ) -> boolean
```
