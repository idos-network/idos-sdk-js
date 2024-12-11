# idOS JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm or the equivalent of your package manager of choice:
```bash
pnpm add @idos-network/idos-sdk ethers near-api-js
```

Only add `ethers` or `near-api-js` in accordance with the chains your dApp uses.


> 💡 Tip
>
> If you use `near-api-js`, make sure you have a `Buffer` polyfill. See https://github.com/near/near-api-js/issues/757.

## Quickstart

Create a container anywhere on your page, and ensure it's displayed when assigned the `visible` class.

```html
<div id="idos-container"></div>
```

```css
div#idos-container {
  display: none;
}

/* Style this however you like. */
div#idos-container.visible {
  display: block;
  width: 160px;
}
```

Import the SDK and initialize it with a selector for the container:

```js
import { idOS } from "@idos-network/idos-sdk";

const idos = await idOS.init({enclaveOptions: {container: "#idos-container"}});
```

Get your user's address and confirm they have an idOS profile. If not, redirect them to your Issuer.

```js
const hasProfile = await idos.hasProfile(address);
if (!hasProfile) window.location = "https://kyc-provider.example.com/enroll";
```

Connect your user's signer to complete the setup.

```js
await idos.setSigner("EVM", signer); // e.g. ethers.Signer
```

You're all set!

```js
const credentials = await idos.data.list("credentials");
console.log(credentials);
// [{ id: "4f4d...", issuer: "Fractal ID", type: "human" }, ...]

const { id } = credentials[0];
const { content } = await idos.data.get("credentials", id);
const isValid = await idOS.verifiableCredentials
  .verify(content)
  .catch((e) => false);
```

> 💡 Tip
>
> For more examples and data queries, see:
>
> - the [quick reference](#quick-reference) below
> - [`📁 idos-example-dapp`](https://github.com/idos-network/idos-sdk-js/tree/main/examples/idos-example-dapp) for a simple implementation
> - [`📁 idos-data-dashboard`](https://github.com/idos-network/idos-sdk-js/tree/main/apps/idos-data-dashboard) for a thorough example

> 🛟 Help available
>
> Would you benefit from support or clarification from our team? Please follow [our support process](https://github.com/idos-network/.github/blob/main/profile/README.md).

## Diving deeper

### Initialization and the `#idos-container`

```js
import { idOS } from "@idos-network/idos-sdk";

const idos = await idOS.init({enclaveOptions: {container: "#idos-container"}});
```

After importing the SDK, you initialize it with a selector string for a DOM node. Make sure to add it to your page:

```html
<div id="idos-container"></div>
```

This container will be used by the SDK to load the idOS secure enclave during initialization. The [`📁 idos-enclave`](https://github.com/idos-network/idos-sdk-js/tree/main/apps/idos-enclave) is a sandboxed browser context, used to safekeep a keyring for cryptographic operations users need to perform. When the enclave requires user interaction, it uses this container to render UI such as the **`🔓 Unlock idOS`** button.

<img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-container-1.png" width="145" />

To avoid surprising your UI, the SDK doesn't make itself visible and sets no CSS properties. Instead, it toggles the `visible` class on this container. This means you retain control over your UI, and need to define what "visible" means, for example:

```css
#idos-container {
  display: none;
}

#idos-container.visible {
  display: block;
}
```

This barebones setup is enough to get you started, but you can naturally style and animate the container as you like, for example within a toast component.

Our [`📁 idos-example-dapp`](https://github.com/idos-network/idos-sdk-js/tree/main/examples/idos-example-dapp) shows an example of blending this into a UI. It wraps the container and floats it over the page, and animates its opacity when the `visible` class is applied. You can see it below (pulsating forcefully to illustrate the point):

<img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-container-2.gif" />

The main reason the SDK controls this HTML element is to remove the burden of opening up a new top-level window without being blocked by the browser because it was identified as an unwanted pop-up. Since all SDK users would need to go through the delicate process of getting these details right, we implemented it in the SDK.

### Other initialization options

The `enclaveOptions`'s `container` is the only required option, but there are a few other aspects of the SDK you're able to control during initialization.

#### `nodeUrl`

The most obvious one is to which network to connect: production, or playground. These can be found, respectively, at:
- https://nodes.idos.network (default)
- https://nodes.playground.idos.network

Here's an example of using the playground network:

```js
const idos = await idos.init({
  nodeUrl: "https://nodes.playground.idos.network",
  enclaveOptions: {container: "#idos-container"},
});
```

#### `dbId`

This concept is very internal to the idOS nodes, and the right value gets automatically discovered during initialization.

Unless you know what you're doing (e.g., deploying a new idOS network with a Kwil schema that's not called `idos`), omit this field.

#### Grant options (`evmGrantsOptions` and `nearGrantsOptions`)

This is only relevant if you use `idos.grants.*` methods.

In order for the SDK to know which access grants contract to use, we need to provide `evmGrantsOptions` or `nearGrantsOptions`, depending on which network the dApp is deployed on.

The default values come from the [.env](https://github.com/idos-network/idos-sdk-js/tree/main/packages/idos-sdk-js/.env) file the SDK is built with. Assuming that file is available as a global `env` object, here are the default values for each options object:

```js
const idos = await idos.init({
  enclaveOptions: {container: "#idos-container"},
  evmGrantsOptions: {
    contractAddress: env.VITE_IDOS_EVM_DEFAULT_CONTRACT_ADDRESS,
    chainId: env.VITE_IDOS_EVM_DEFAULT_CHAIN_ID,
  },
  nearGrantsOptions: {
    network: env.VITE_IDOS_NEAR_DEFAULT_NETWORK;
    contractId: env.VITE_IDOS_NEAR_DEFAULT_CONTRACT_ID;
    rpcUrl: env.VITE_IDOS_NEAR_DEFAULT_RPC_URL;
  },
});
```

You can take a look at the current contract deployments on [github.com/idos-network/idos-access-grants](https://github.com/idos-network/idos-access-grants/blob/master/README.md#deployments).

#### `enclaveOptions`

So far, we've only used `container` from `enclaveOptions`. There are a few more fields that you can set:

- `theme?: "light" | "dark"`: Forces a specific theme for the enclave pop-up. By default, this is discovered through the media query `prefers-color-scheme`.
- `mode?: "new" | "existing"`: Forces a specific verbiage to be shown on the enclave pop-up. The default is `existing`, but issuers can set it to `new` to show messages that are more helpful for new users. Unless you're an issuer, this should not be supplied.
- `url?: string`: URL of the enclave pop-up. Unless you're developing your own enclave, this should not be supplied.
- `throwOnUserCancelUnlock?: boolean`: Controls the SDK's reaction to the user closing the enclave pop-up. The default, `false`, keeps the **🔓 Unlock idOS** button visible so the user can click it again and finish the unlocking process. If this value is `true`, the SDK will hide the button and raise whatever error it got from the enclave pop-up.

### Using `hasProfile`

You can check if your user has an idOS profile associated with their address by using `await idos.hasProfile(address)`. This can be done without a signature, and confirms that calls to `setSigner` should succeed.

```js
const hasProfile = await idos.hasProfile(address);
```

If your user does not have an idOS profile, you'll have to first redirect them to your credential provider. Here's an example:

```js
if (!hasProfile) window.location = "https://kyc-provider.example.com/enroll";
```

### The `setSigner` flow and supported wallets

```js
const { humanId } = await idos.setSigner("EVM", signer);
```

Besides `hasProfile`, all other queries to idOS nodes require a valid signature. These are performed by your user's wallet, whose signer must be passed to the SDK via the `setSigner` method. Your user's wallet might need to be triggered, so you should be mindful of when in your user's journey you call this method.

When called, `setSigner` will try to connect to the idOS nodes, sign a [Sign-In With Ethereum](https://eips.ethereum.org/EIPS/eip-4361) (SIWE) message for authentication, and make a call to get some basic information about the user.

> 🛈 Note about NEAR
>
> Because idOS thinks in terms of signing keys, but NEAR thinks in terms of accounts that can be controlled by multiple signing keys, the SDK needs to discover the signing key that's currently being used. This requires a signed message from the user.
>
> Here's an example of what that looks like with Meteor:
>
> <img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-sign-near.png" width="250" />

Here's an example of what signing a SIWE message looks like with Metamask:

<img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-sign-siwe.png" width="250" />

During this whole process, the SDK tries to use the browser's local storage to remember this signer's address (and public key, for NEAR signers) to avoid repeating this process unless necessary.

The idOS currently supports two classes of signers:

- Ethereum/EVM wallets (like MetaMask or Trust Wallet) producing [EIP-191](https://eips.ethereum.org/EIPS/eip-191) `secp256k1` signatures (aka `personal_sign`)
- NEAR/NVM wallets (like MyNearWallet or Meteor) producing [NEP-413](https://github.com/near/NEPs/blob/master/neps/nep-0413.md) `ed25519` signatures (aka `signMessage`)

### Exploring the user's data

Now that we're successfully authenticated on idOS, we can now perform operations on user data. The entities that a user controls are:

- **Wallets**: the wallets that the user has declared as being able to control their idOS profile.
- **Credentials**: the credentials of a user. Their contents are encrypted (for the user's encryption key), but it also has some public fields for inspection.
- **Attributes**: free form key-value entries. You can use this to store public attribute about the user.

All of these can be created, retrieved, updated, or deleted. The only notable exceptions is deleting shared credentials with timelocks still active (more on this when we explain Access Grants).

Here's an example of listing a user's credentials:
```js
const credentials = await idos.data.list("credentials");
console.log(credentials);
// [{ id: "4f4d...", issuer: "FractalID", type: "human" }, ...]
```

### Decrypting the user credential content

> ⚠️ Warning
>
> This is only meant to be used on admin-like dApps (like https://dashboard.idos.network/).
>
> If the user hasn't granted you an Access Grant, the user hasn't consented to you getting a copy of the data. We'll be covering Access Grant in a following section.
>
> For now, please use idOS responsibly and respect the user's will and data sovereignty. In order to protect the user, we're planning on changing how this admin-like access works in the near future, so please don't rely on it.

Today, as a shortcut, we decrypt the credential's content on `get`:
```js
const { content } = await idos.data.get("credentials", credentials[0].id);
```

The manual version on this shortcut looks like this:
```js
const credential = await idos.data.get(
  "credentials",
  credentials[0].id,
  false, // `false` here means "don't ask the user to decrypt the contents"
);

const content = await idos.enclave.decrypt(
  credential.content,
  credential.encryptor_public_key,
)
```

This call needs to operate with the user's encryption key. This is a responsibility of the Enclave, which we'll explain in the next section.

Now you have access to the decrypted credential contents. If it's a [W3C Verifiable Credential](https://www.w3.org/TR/vc-data-model-2.0/), you can check it's authenticity with:
```js
await idOS.verifiableCredentials.verify(content)
```

This function always returns `true` or raises an Error detailing what went wrong with the verification process.

### Unlocking the idOS enclave

Credential contents stored in the idOS are encrypted such that only its owner (your user) can make sense of it. Since key management is neither a common nor an expectable practice among non-technical folks, this key is derived from the user's password/passkey. The key derivation process is handled by the idOS secure enclave to enable users to perform [authenticated asymmetric ECC encryption / decryption](https://cryptobook.nakov.com/asymmetric-key-ciphers/elliptic-curve-cryptography-ecc#curve25519-x25519-and-ed25519).

Since the SDK does not have access to this key, it delegates decryption workloads to the enclave when responding to data requests involving encryption/decryption. This happens transparently when you use the SDK to read encrypted data from the idOS.

After the user clicks the **🔓 Unlock idOS** button, a secure dialog opens for the user to choose their preferred unlocking method.

<table border="0"><tr align="center"><td>
  <i>The unlock dialog</i>
</td></tr><tr align="center"><td>
  <img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-auth-dialog.png" width="250" />
</td></tr></table>

If the user chooses **Password**, they'll be prompted to enter it.

<table border="0"><tr align="center"><td>
  <i>The password dialog</i>
</td></tr><tr align="center"><td>
  <img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-dialog-password.png" width="250" />
</td></tr></table>

If they choose **Passkey**, we'll use their platform authenticator (you can learn more about passkeys [here](https://developers.google.com/identity/passkeys)).

<table border="0"><tr align="center"><td>
  <i>A passkey dialog</i>
</td></tr><tr align="center"><td>
  <img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-dialog-passkey.png" width="250" />
</td></tr></table>

The selected auth method will not have a bearing on the encryption capabilities.

### Intermission: who are you?

Like mentioned before, in order to lawfully obtain a copy of the user's credentials, the user must grant you an Access Grant. We'll expand on that concept next, but first you need to have some preparation measures in place.

There are two things that a dApp needs to have setup:
- A `grantee`: a key for a chain account you control. It's used both to identify you as the recipient of an Access Grant and to authenticate you when making calls to idOS nodes. On EVM chains, this is an EOA (Externally-Owned Account, controlled by anyone with its private key), and on NEAR this is a full access public key. For now, the idOS doesn't support having contract wallets as grantees.
- An `encryptionPublicKey`: a key you control that'll be used to decrypt credential contents shared with you. This should be a [nacl.box.keyPair](https://github.com/dchest/tweetnacl-js/blob/master/README.md#naclboxkeypair).


> 🛑 DANGER 🛑
>
> Make sure you don't lose access to either secret keys. Otherwise, you won't be able to authenticate or decrypt credential contents. The idOS team won't be able to help you.

### Access Grants

An Access Grant means: I, `owner` (the user), have given you, `grantee` (the dApp), access to the record identified by `dataId`, and I understand I won't be able to revoke said access before `lockedUntil` has passed. The contents of `dataId` are a copy of the credential/attribute that has its contents encrypted to the encryption key provided (by the dApp) during its creation.

By acquiring an Access Grant, a dApp ensures that it'll have a copy of the user's data (either a credential or an attribute) until the UNIX timestamp on `lockedUntil` has passed. This is especially relevant to be able to fulfill compliance obligations.

This is achieved by combining two mechanisms:

- On idOS, by asking the user to share a credential/attribute, which creates a copy of its current state, encrypted to the `receiverPublicKey` you provide. The id of this copy is what's called `dataId`.
- On the blockchain you're using, by creating an Access Grant entry in a Smart Contract on the chain you're using.

The combination of doing these two operations is bundled in `idos.grants.create`, and that's the intended API for common usage. Here's an example of what that looks like:

```js
// These don't necessarily have to come from a server, but it's the typical setup.
const {
  encryptionPublicKey,
  lockTimeSpanSeconds,
  grantee,
} = await yourBackendService.getInfo();

const { grant: { dataId } } = await idos.grants.create(
  "credentials",
  credentials[0].id,
  grantee,
  Math.floor(Date.now() / 1000) + lockTimeSpanSeconds,
  encryptionPublicKey,
);
```

> 💡 Tip
>
> See a working example [idos-example-dapp](https://github.com/idos-network/idos-sdk-js/tree/main/examples/idos-example-dapp)

To avoid any doubts, let's go over the Access Grant fields:

- `owner`: on EVM chains this is a wallet address the user controls, and on NEAR this is a full access public key from an account the user controls.
- `grantee`: on EVM chains this is the dApp's grantee address (like explained in the previous section), and on NEAR this is a full access public key.
- `dataId`: the `id` of the record copy (either a credential or an attribute) that is going to be shared.
- `lockedUntil`: the earliest UNIX timestamp when the contract will allow the Access Grant to be revoked. Any timestamp in the past, notably "0", means it's revocable at any time.

### Filtering credentials

One common problem about credentials is: if the dApp can only access a credential's contents after it has an Access Grant for it, how does the dApp know which credential will fulfill its compliance needs?

`idos.enclave.filterCredentials` is a function that allows you to ask the user's enclave to filter all the user's credentials to only return the ones your dApp is interested in asking an Access Grant for.
A filtering criteria for `pick` and `omit` should be passed. This should be the paths of the private fields by which a credential should be matched. `pick` requires the path to have the provided value, `omit` requires the path to not have the provided value.

```js
const entries = await idos.enclave.filterCredentials(credentials, {
  pick: {
    "credentialSubject.identification_document_country": "DE"
  },
  omit: {
    "credentialSubject.identification_document_type": "passport",
  },
});
```

In this example, `entries` will be a list of credentials where the `"credentialSubject.identification_document_country"` is `"DE"` and `"credentialSubject.identification_document_type"` is not `"passport"`.

You can also use `idos.grants.shareMatchingEntry`, a helper function that:
- Gets all the user's credentials
- Can filter by public fields
- Calls `idos.enclave.filterCredentials`
- Calls `idos.grants.create` with the first matching credential

Here's an example similar to the previous one, but that also filters a couple of public fields:

```js
await idos.grants.shareMatchingEntry(
  "credentials",
  {
    credential_level: "basic",
    credential_type: "kyc",
  },
  {
    pick: {
      "credentialSubject.identification_document_country": "DE"
    },
    omit: {
      "credentialSubject.identification_document_type": "passport",
    },
  },
  grantee,
  Math.floor(Date.now() / 1000) + lockTimeSpanSeconds, // timelock
  encryptionPublicKey,
);
```

### Checking Access Grant contents

By now, we have used the idOS to secure a copy of the data we need to operate.

If you wish to consult it, you'll need to use the `grantee` and [`nacl.box.keyPair`](https://github.com/dchest/tweetnacl-js/blob/master/README.md#naclboxkeypair) we've prepared before. Because these are secret, we need call some code in a private place (i.e., a backend, or maybe scripts you run locally).

Here's an example of how you could achieve that with [`📁 idos-sdk-server-dapp`](https://github.com/idos-network/idos-sdk-js/tree/main/packages/idos-sdk-server-dapp) for an EVM grantee:

```js
import { idOSGrantee } from "@idos-network/idos-sdk-server-dapp";
import { ethers } from "ethers";

const granteeSigner = new ethers.Wallet(
  process.env.EVM_GRANTEE_PRIVATE_KEY,
  new ethers.JsonRpcProvider(process.env.EVM_NODE_URL),
);

const idosGrantee = await idOSGrantee.init({
  chainType: "EVM",
  granteeSigner,
  encryptionSecret: process.env.ENCRYPTION_SECRET_KEY,
});

// This assumes we got `dataId` (from a request body, a script argument, etc).
const contents = await idosGrantee.getSharedCredentialContentDecrypted(dataId);
```

> 💡 Tip
>
> See a working example backend on [idos-example-dapp/api](https://github.com/idos-network/idos-sdk-js/tree/main/examples/idos-example-dapp/api). It has two flavors:
>
> - [EVM](https://github.com/idos-network/idos-sdk-js/blob/main/examples/idos-example-dapp/api/EVM.ts)
> - [NEAR](https://github.com/idos-network/idos-sdk-js/blob/main/examples/idos-example-dapp/api/NEAR.ts)

### Delegated Access Grants

A delegated Access Grant (dAG) is a way of creating / revoking an Access Grant by somebody else other than the user. This is especially relevant for dApps who want to subsidize the cost of transaction necessary to create an AG.

Here's a diagram comparing the two cases side-by-side:

<img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-ag-vs-dag.png" />

This is accomplished by getting the user's signature a specific message, generated with the contract's `insert_grant_by_signature_message` method, that can then be used to call the contract's `insert_grant_by_signature` method.

The message building function is exposed as `idos.grants.messageForCreateBySignature`. Submitting the resulting message and its user signature is exposed as `idosGrantee.createBySignature`.

> ⚠️ Notice
>
> This is not implemented for NEAR yet. If you want to use dAGs today, you'll have to call the right contract directly.

## Quick reference

### Importing and initializing

```js
import { idOS } from "@idos-network/idos-sdk";

const idos = await idOS.init({ enclaveOptions: {container: "css selector"} });
```

### EVM signer setup

```js
const CHAIN_TYPE = "EVM";
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
const address = await signer.getAddress();
```

### NEAR signer setup

```js
const CHAIN_TYPE = "NEAR";
const {
  defaultContractId: contractId,
  contractMethods: methodNames,
  defaultNetwork: network,
} = idOS.near;

const selector = await setupWalletSelector({
  network,
  modules: [setupMeteorWallet(), setupMeteorWallet()],
});

!selector.isSignedIn() &&
  (await new Promise((resolve) => {
    const modal = setupModal(selector, { contractId, methodNames });

    modal.on("onHide", resolve);
    modal.show();
  }));

const signer = selector.wallet();
const address = (await signer.getAccounts())[0].accountId
```

### Profile checking and `setSigner`

```js
const hasProfile = await idos.hasProfile(address);
if (!hasProfile) window.location = "https://kyc-provider.example.com/enroll";
const { humanId } = await idos.setSigner(CHAIN_TYPE, signer);
```

### Credentials

```js
// Get all credentials
const credentials = await idos.data.list("credentials");

//Get all credentials that match a condition
const credentials = await idos.data.list("credentials", { issuer: "Fractal ID" };

// Get the credential details
const { id } = credentials.find(c => c.credential_type === "basic");
const { content } = await idos.data.get("credentials", id);

// Validate that a credential is well signed
const isValid = await idOS.verifiableCredentials.verify(content).catch(e => false);
```

### Creating / updating / deleting data

```js
const { id } = await idos.data.create("attributes", {
  attribute_key: "highScore",
  value: "10",
});

await idos.data.update("attributes", { id, value: "1000" });

await idos.data.delete("attributes", id);
```

### Access Grant creation / revocation / list

Here's some example code of creating, revoking and listing Access Grants.

```js
// Decide on the credential you want to create an Access Grant for
const credentialId = credentials[0].id;

// Share a credential by creating an access grant
const { grant } = await idos.grants.create(
  "credential",
  credentialId,
  grantee,
  timelock,
  receiverPublicKey
);

// Revoke an access grant
await idos.grants.revoke(
  "credentials",
  credentialId,
  grantee,
  dataId,
  timelock
);

// List all grants that match a criteria
await idos.grants.list({
  owner,
  dataId,
  grantee,
});

// Share a credential that matches the filtering criteria.
await idos.grants.shareMatchingEntry(
  "credentials",
  {
    credential_level: "basic",
    credential_type: "kyc",
  },
  {
    pick: {
      "credentialSubject.identification_document_country": "DE",
    },
    omit: {},
  },
  grantee,
  0, // timelock
  "zleIscgvb3usjyVqR4OweNM2oXwmzADJVO3g7byuGk8=", // receiverPublicKey
);
```

### Creating a dAG on EVM

```js
/*
 * Client side.
 */

// Create a share (duplicate) in the idOS and get its id:
const { id: dataId } = await idos.data.share(tableName, recordId, receiverPublicKey);

// Get a message that needs to be signed by the user:
const message = await idos.grants.messageForCreateBySignature({
  owner,
  grantee,
  dataId,
  lockedUntil
});

// The dApp should ask the user to sign this message:
const { signature } = await wallet.signMessage({ message, recipient, nonce });

/*
 * Server side.
 *
 * ⚠️ Notice: Not implemented for NEAR yet.
 */
import { idOSGrantee } from "@idos-network/idos-sdk-server-dapp";
import { ethers } from "ethers";

const granteeSigner = new ethers.Wallet(
  process.env.EVM_GRANTEE_PRIVATE_KEY,
  new ethers.JsonRpcProvider(process.env.EVM_NODE_URL),
);

// Initialize the idOSGrantee
const idosGrantee = await idOSGrantee.init({
  chainType: "EVM",
  granteeSigner,
  encryptionSecret: process.env.ENCRYPTION_SECRET_KEY
});

// Create the dAG
await idosGrantee.createBySignature({
  // These values need to be the same you used to generate the signed message
  owner,
  grantee,
  dataId,
  lockedUntil,
  // This is the signature you got from the user.
  signature,
})
```

## Developing the SDK locally

Create an `.env.development.local` file in the root folder of the SDK package and add the needed environment variables (you can reference `.env` for the variable names).
The SDK will use these variables for the development environment.

Run:
```bash
pnpm dev
```
This will run the compiler in watch mode that will rebuild every time any of the source files are changed.

You can also create a production build by running the following command in the root folder of the SDK package:
```bash
pnpm build
```
This will create a PRODUCTION build of the SDK using the `.env` file.
