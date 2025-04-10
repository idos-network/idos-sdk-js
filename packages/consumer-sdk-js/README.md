# idOS Consumer Server SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Audience and features

The idOS Consumer Server SDK is designed for application developers who need to access user credentials through access grants and verify them. This package caters specifically to backend needs. It provides an implementation for decrypting and processing credentials, managing access grants, and implementing [passporting](../../docs/glossary.md#passporting)-compliant credential sharing workflows.

## What you’ll need

### Secrets

> 🛑 DANGER 🛑
>
> Make sure you don't lose access to either secret keys. Otherwise, you won't be able to authenticate or decrypt credential contents. The idOS team won't be able to help you.

You'll need:
  - `recipientEncryptionPrivateKey`: base64-encoded `nacl.BoxKeyPair` secret key. It'll be used to decode the credential copies that the owners (users) share with you by creating access grants.
  - `consumerSigner`: this can be a NEAR `KeyPair`, a `nacl.SignKeyPair`, or an `ethers.Wallet`. This will be used to sign RPC calls to the idOS nodes.

### Code

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm (or your package manager of choice):

```
pnpm add @idos-network/consumer-sdk-js
```

## Usage

### Server-side
#### Import and initialization

```js
import { idOS } from "@idos-network/consumer-sdk-js/server";
import nacl from "tweetnacl";

/**
 * Initializes the idOS SDK with the provided options.
 *
 * @async
 * @function init
 * @param {Object} options - Configuration options for initializing the SDK.
 * @param {string} options.recipientEncryptionPrivateKey - The recipient's encryption private key.
 * @param {KeyPair | SignKeyPair | ethers.Wallet} options.granteeSigner - The grantee's wallet or key pair for signing transactions.
 * @param {string} [options.nodeUrl="https://nodes.idos.network"] - The URL of the idOS node.
 * @param {string} [options.chainId] - The chain ID for the network (optional).
 * @returns {Promise<idOSGrantee>} - A promise that resolves to an instance of the idOS SDK.
 */

export const idos = await idOS.init({
  nodeUrl: process.env.IDOS_NODE_URL,
  recipientEncryptionPrivateKey: process.env.CONSUMER_ENCRYPTION_SECRET_KEY,
  // TODO require less crap from the user. This is way too much functions.
  consumerSigner: nacl.sign.keyPair.fromSecretKey(base64Decode(process.env.CONSUMER_SIGNING_SECRET_KEY))
});
```

#### List grants

Here's how you can paginate through all the grants that all users have granted you.

TODO: I should be able to filter by owner, at least.

```js
const grants: IdosCredentials[] = await idos.getGrants({
  page: 1,
  size: 7,
})
```

#### Get grants total count

Here's how you can count  all the grants that all users have granted you. Especially useful for pagination.

TODO: I should be able to filter by owner, at least.

```js
const grantsTotalCount: number = await idos.getGrantsCount()
```

#### Get the shared credential with a consumer (encrypted content)

Here's how you can get a credential you have access to (with the _content still encrypted_) by its id.

TODO signature feels iffy. I should get into it and make sure that it returns something like a `Result<Maybe<IdosCredential>, Error>`. Either:
- The target credential
- `null` when we don't find anything
- raise an exception on network errors and such

```js
const credential: IdosCredentials[] = await idos.getSharedCredentialFromIDOS('GRANT_DATA_ID')
```

#### Get the decrypted shared credential's content

Here's how you can get a credential's contents you have access to by its credential id.

```js
const credentialContents: string = await idos.getSharedCredentialContentDecrypted('GRANT_DATA_ID')
```

#### Get the credential id using grant hash

Here's how you can get a credential's id you have access to by its content hash.

This is used in [passporting](../../docs/glossary.md#Passporting).

```js
const credentialId: id | null = await idos.getCredentialIdByContentHash('GRANT_HASH')
```

#### Get the Access Grant that gave access to a credential

```js
const grant: idOSGrant = await idos.getCredentialAccessGrant('CREDENTIAL_ID')
```

#### Get the reusable credential compliantly

This function enables other obligated entities (see [passporting](../../docs/glossary.md#Passporting)) to have access to credential after owner approves sharing their credential with you.

```js
const credential: idOSCredential = await idos.getReusableCredentialCompliantly('GRANT_HASH')
```
