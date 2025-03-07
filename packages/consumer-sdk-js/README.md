# idOS Grantee JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Intro: audience and features

The idOS Consumer JavaScript SDK is designed for application developers who need to access data and consume credential data shared through idOS Access Grants. This package caters specifically to both [frontend](./src/client/) and [backend](./src/server/) services and dApps acting as "consumers" - entities that have been granted permission to access user credentials in the idOS ecosystem. It provides a server-side implementation for decrypting and processing credentials, managing Access Grants, and implementing Passporting-compliant credential sharing workflows

Developers working with regulatory requirements, KYC/identity verification services, or any application that needs secure, permissioned access to user data will find this SDK particularly valuable for building privacy-preserving services without handling raw credential data directly.

## What you’ll need

### Secrets

TODO what secrets do I need to operate this, and were do I use them?

### Code

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm or the equivalent of your package manager of choice:
```
pnpm add @idos-network/idos-sdk-server-dapp \
  ethers near-api-js # These two are optional; only install the ones you for working with your network.
```

## Usage
### Client-side

TODO: Implement me. We still haven't moved the functions over.

- frontend
    - import and initialization
        - `pnpm add @idos-network/idos-consumer-sdk-frontend`
        - `import { idOS } from...`
        - `idOS.init({ isleOptions: { container: “#idos-container” } })`
    - basic user flow
        - connect wallet
        - check if has profile
        - `setSigner`
        - find valid credential (type + issuer)
            - here’s how you can filter the user’s credentials for adequacy
                - `.filter(issuer: “…”, credential_type: “…”)`
                - you may need to filter based on encrypted data if you have country restrictions
                    - in this scenario, the user will have to unlock their enclave in order to enable decryption
                    - `.filter(country: “…”)`
        - ensure access to your desired credential
            - request access grant
                - how timelocks

### Server-side
#### Import and initialization

```js
import { idOS } from "@idos-network/consumer-sdk-js";
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
  recipientEncryptionPrivateKey: process.env.GRANTEE_ENCRYPTION_SECRET_KEY,
  // TODO require less crap from the user. This is way too much functions.
  granteeSigner: nacl.sign.keyPair.fromSecretKey(base64Decode(process.env.GRANTEE_SIGNING_SECRET_KEY))
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

#### Get the shared credential with a grantee (encrypted content)

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
