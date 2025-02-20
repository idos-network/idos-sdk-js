# idOS Grantee JavaScript SDK.

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm or the equivalent of your package manager of choice:
```
pnpm add @idos-network/idos-sdk-server-dapp ethers near-api-js
```

## Quickstart.

Import the SDK and initialize it:

```js
import { idOS } from "@idos-network/grantee-sdk-js";
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
 * @param {string} [options.dbId] - The database ID for the network (optional).
 * @returns {Promise<idOSGrantee>} - A promise that resolves to an instance of the idOS SDK.
 */

export const sdk = await idOS.init({
  nodeUrl: process.env.IDOS_NODE_URL,
  recipientEncryptionPrivateKey: process.env.GRANTEE_ENCRYPTION_SECRET_KEY,
  granteeSigner: nacl.sign.keyPair.fromSecretKey(base64Decode(process.env.GRANTEE_SIGNING_SECRET_KEY))
});
```

### Grant Object Anatomy

The `Grant` object represents access permissions for a specific credential. It has the following properties:

| Property         | Type                | Description                                                                 |
|------------------|---------------------|-----------------------------------------------------------------------------|
| `id`             | `string`            | The unique identifier of the grant.                                         |
| `ownerUserId`    | `string`            | The ID of the user who owns the credential.                                 |
| `granteeAddress` | `string`            | The address of the grantee (the entity granted access).                     |
| `dataId`         | `string`            | The ID of the shared credential data.                                       |
| `lockedUntil`    | `number`            | A timestamp (in milliseconds) until which the grant is locked.             |
| `hash`           | `string` | The content hash of the credential.                             |


### Listing grants.

```js
import {sdk} from './idOS'

const grants = await sdk.getGrants({
  page: 1,
  size: 7,
})
```

### Get grants total count.

```js
import {sdk} from './idOS'

const grantsTotalCount = await sdk.getGrantsCount()
```

### Getting shared credential with a grantee (encrypted content).

```js
// Import the initialized sdk instance.
import {sdk} from './idOS'

const grants = await sdk.getSharedCredentialFromIDOS('GRANT_DATA_ID')
```

### Getting shared credential content (decrypted).

```js
// Import the initialized sdk instance.
import {sdk} from './idOS'

const credentialContent = await sdk.getSharedCredentialContentDecrypted('GRANT_DATA_ID')
```

### Getting credential ID using grant hash.

```js
// Import the initialized sdk instance.
import {sdk} from './idOS'

const grants = await sdk.getCredentialIdByContentHash('GRANT_HASH')
```

### Getting Access Grant that gave access to a credential.

```js
// Import the initialized sdk instance.
import {sdk} from './idOS'

const grants = await sdk.getCredentialAccessGrant('CREDENTIAL_ID')
```

### Getting Reusable Credential Compliantly.
This feature enables other obligated entities (OE2) to have access to credential after owner approves sharing his/her credential with this entity.

```js
// Import the initialized sdk instance.
import {sdk} from './idOS'

const grants = await sdk.getReusableCredentialCompliantly('GRANT_HASH')
```
