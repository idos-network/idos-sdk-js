# idOS JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) with `pnpm add @idos-network/idos-sdk` (or the equivalent of your package manager of choice).

## Quickstart

```js
import { idOS } from "@idos-network/idos-sdk";

// initialize SDK
const idos = await idOS.init({ container: "#idos" });
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

See the more complete example at [apps/idos-example-dapp](../../apps/idos-example-dapp).

## "Types"

```
EvmSigner
ethers.Signer | eip191Signer{ signMessage: Function }

NearSigner
WalletSelector.Wallet | nep413Signer{ signMessage: Function }

Address
evmAddress: string | nearAddress: string | string

Profile
{ humanId: string, address: Address }

Record
{ id: string }

Attribute: Record
{ ...Record, humanId: string, attribute_key: string, value: string }

Credential: Record
{ ...Record, humanId: string, credential_type: string, issuer: string, content: string }

Wallet: Record
{ ...Record, humanId: string, address: Address, publicKey: string, message: string, signature: string }

Grant
{ owner: Address, grantee: Address, dataId: Record.id, lockedUntil: uint32 }

EncryptionPublicKey
{ base64: string, raw: Uint8Array[32] }

TableName
"attributes" | "credentials" | "wallets"

CredentialIssuer
{ name: string, publicKey: string }

CryptoOptions
{ skipEncryption: string[] }
```

## Interface

```
idos =
    idOS.init({
        container: cssSelector,
        nodeUrl: string?,
    }) -> Promise{ new idOS() }

idos.auth.

    setEvmSigner(
        EvmSigner,
    ) -> null

    setNearSigner(
        NearSigner,
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
        Record.id,
    ) -> Promise{ Record }

    create(
        TableName,
        Record,
        EncryptionPublicKey.base64?,
        CryptoOptions?,
    ) -> Promise{ Record }

    update(
        TableName,
        Record{ id },
        CryptoOptions?,
    ) -> Promise{ Record }

    delete(
        TableName,
        Record.id,
    ) -> Promise{ Record }

    share(
        TableName,
        Record{ id },
    ) -> Promise{ Record'{} )

idos.grants.

    init({
        type: "evm",
        signer: EvmSigner,
    }) -> null

    init({
        type: "near",
        accountId: nearAddress,
        wallet: NearSigner,
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

idos.verifiableCredentials.

    verify(
        Credential.content,
        {
            allowedSigners?: jsigs.suites.LinkedDataSignature | jsigs.suites.LinkedDataSignature[],
            allowedIssuers?: string[],
            signatureBuilders?: Object.{ string, (any) => Promise{ jsigs.suites.LinkedDataSignature } },
            documentLoader?: jsonld.documentLoader,
        }?,
    ) -> boolean
```
