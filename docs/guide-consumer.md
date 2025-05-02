# Consumer Guide

## Required reading

* [idOS System Overview](README.md)
* [The Enclave](enclave.md)

## SDK feature overview

The primary features provided by the Consumer SDK are:
* checking if your user has an idOS profile and an adequate credential;
* requesting access to user credentials, with an optional timelock to prevent premature access revocation;
* retrieving and verifying credentials you've been granted access to;
* listing all access grants you've been given by your users;
* implementing a [Passporting-compliant](passporting.md) onboarding flow.

## Getting started: what you'll need

### Compliance guidance

See [idOS Regulatory approach](https://docs.idos.network/compliance/idos-regulatory-approach) for more context, and discuss with your compliance officer:

* which credential Issuers are you open to trusting;
* how long, if at all, you need to retain access to user data;
* whether you’re going to be using [Passporting](passporting.md).

### Signature and encryption keys

> 🛑 DANGER 🛑
>
> Make sure you don't lose access to either secret keys. Otherwise, you won't be able to authenticate or decrypt credential contents. The idOS team won't be able to help you.

You'll need:
  - `recipientEncryptionPrivateKey`: base64-encoded `nacl.BoxKeyPair` secret key. It'll be used to decode the credential copies that the owners (users) share with you by creating access grants.
    - see [Encryption](encryption.md) for more information
  - `consumerSigner`: this can be a NEAR `KeyPair`, or an `ethers.Wallet`. This will be used to sign RPC calls to the idOS nodes.
    - see [Signatures](signatures.md) for more information

### A frontend

Your frontend (web or native app), as your user’s touch point, is where you’ll:

- confirm that the user is in idOS;
- find whether the user has an adequate credential;
- request an access grant to user credentials.

### A backend

Your backend (private server) is where you’ll:

- retrieve user credentials you’ve been granted access to;
- list the access grants you’ve been granted.

### Our Consumer SDK

Get our NPM packages
* https://www.npmjs.com/package/@idos-network/client
* https://www.npmjs.com/package/@idos-network/consumer

and their dependencies with pnpm (or your package manager of choice)

```
pnpm add @idos-network/client
pnpm add @idos-network/consumer
```

## Usage

### [ frontend ] Importing and initializing

```js
import { createIDOSClient, type idOSClient } from "@idos-network/client";

const idOSClient = createIDOSClient({
  enclaveOptions: { container: "#idOS-enclave" },
});
```

### [ backend ] Importing and initializing

```typescript
import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";

const idOSConsumer = await idOSConsumerClass.init({
  consumerSigner,
  recipientEncryptionPrivateKey,
});
```

### [ frontend ] Connecting your user's wallet

Connect your user's wallet however you do it today, for example:

```js
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
```

### [ frontend ] Checking if you user has an idOS profile

Get your user's address from the signer above and confirm they have an idOS profile. If not, redirect them to your Issuer. If you have an IDV integration, you can yourself be the issuer. See the [Issuer Guide](issuer.md) for more information.

```js
const address = await signer.getAddress();
const hasProfile = await idOSClient.addressHasProfile(address);

if (!hasProfile) window.location = "https://kyc-provider.example.com/enroll";
```

### [ frontend ] Setting signer

Pass your user’s signer to the SDK, so it knows where to send signature requests to.

```js
idOSClient = await idOSClient.withUserSigner(signer);
```

### [ frontend ] Checking for existing access grant

```js
const grants: IdosGrant[] = await idOSClient.getGrants().grants.filter(g =>
  g.ag_grantee_wallet_identifier === consumerSigner.address,
);
```

Access Grants queries can also be paginated:
```typescript
const grants: IdosGrant[] = await idOSClient.getGrants({
  page: 1,
  size: 7,
});
```

Optionally, you can double check that the existing access grant matches your requirements. You do this on your backend.

```typescript
const credentialContents: string = await idOSConsumer.getSharedCredentialContentDecrypted('GRANT_DATA_ID')
```

If you don’t have an access grant, you can proceed to filtering the user’s credentials and requesting one or more access grants.


### [ frontend ] Filtering credentials

* TODO: missing extraction into Client SDK

https://github.com/idos-network/idos-sdk-js/blob/cd0605a4e545836a6d9fc4751a31c142fc28fd8c/packages/%40controllers/src/isle/index.ts#L460-L486

### [ frontend ] Requesting access grant


The simplest way to do this is to ask the user to create and insert an access grant for you.

* TODO: missing extraction into Client SDK

https://github.com/idos-network/idos-sdk-js/blob/cd0605a4e545836a6d9fc4751a31c142fc28fd8c/packages/%40controllers/src/isle/index.ts#L341-L369

Alternatively, you can ask for a delegated access grant, which the user creates:

```js
await idOSClient.requestDAGMessage({
  dag_owner_wallet_identifier, // This is the user
  dag_grantee_wallet_identifier, // This is you, the consumer
  dag_data_id,
  dag_locked_until, // Unix timestamp. According to your compliance officer's instructions.
});
```

and you then insert after sending it to your backend:

```js
await idOSConsumer.createAccessGrantByDag({
  dag_data_id,
  dag_owner_wallet_identifier,
  dag_grantee_wallet_identifier,
  dag_signature,
  dag_locked_until,
});
```

#### Using passporting

* TODO: missing code examples for [passporting](passporting.md):
    * ask for credential duplicate (C1.2) separately and before asking for AG
    * get hash from C1.2 and use it on dAG request
    * send dAG to own backend, which proxy sends to OE1's passporting server

### [ backend ] Retrieving and verifying credential

```typescript
const credentialContents: string = await idOSConsumer.getSharedCredentialContentDecrypted('GRANT_DATA_ID')
```

If you're using passporting:
```typescript
const credentialContents: string = await idOSConsumer.getReusableCredentialCompliantly('GRANT_DATA_ID')
```

If you need a helper to verify that the W3C VC is something you want to trust, here's an example:

```js
await idOSConsumer.verifyW3CVC(credential, {
  allowedIssuers: ["https://kyc-provider.example.com/idos"],
  allowedKeys: ["z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5"],
  documentLoader, // If you need to specify your own.
});
```
