# idOS JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with `pnpm add @idos-network/idos-sdk ethers near-api-js` (or the equivalent of your package manager of choice).

## Quickstart

Create a container anywhere on your page, and ensure it's displayed when assigned the `visible` class.

```html
<div id="idos-container"></div>
```

```css
div#idos-container {
  display: none;
}
div#idos-container.visible {
  display: block;
}
```

Import the SDK and initialize it with a selector for the container:

```js
import { idOS } from "@idos-network/idos-sdk";

const idos = await idOS.init({ container: "#idos-container" });
```

Connect your user's wallet and use its signer to complete the setup.

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
const isValid = await idOS.verifiableCredentials.verify(content).catch((e) => false);
```

> [!NOTE]
> For more examples and data queries, see:
>
> - the [quick reference](#quick-reference) below
> - [`📁 idos-example-dapp`](../../apps/idos-example-dapp) for a simple implementation
> - [`📁 idos-data-dashboard`](../../apps/idos-data-dashboard) for a thorough example

> [!TIP]
> Need support? Please follow [this process](https://github.com/idos-network/.github/blob/main/profile/README.md).

## Diving deeper

### Initialization and the `#idos-container`

```js
import { idOS } from "@idos-network/idos-sdk";

const idos = await idos.init({ container: "#idos-container" });
```

After importing the SDK, you initialize it with a selector string for a DOM node. Make sure to add it to your page:

```html
<div id="idos-container"></div>
```

This container will be used by the SDK to load the idOS secure enclave during initialization. The [`📁 idos-enclave`](../../apps/idos-enclave) is a sandboxed browser context, used to safekeep a keyring for cryptographic operations users need to perform. When the enclave requires user interaction, it uses this container to render UI such as the **`🔓 Unlock idOS`** button.

<img src="./assets/readme-container-1.png" width="145" />

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

Our [`📁 idos-example-dapp`](../../apps/idos-example-dapp) shows an example of blending this into a UI. It wraps the container and floats it over the page, and animates its opacity when the `visible` class is applied. You can see it below (pulsating forcefully to illustrate the point):

<img src="./assets/readme-container-2.gif" />

### Using `hasProfile`

You can check if your user has an idOS profile using await `idos.hasProfile(address)`. This can be done without a signature, unlike the `setSigner` flow described below, making your UX simpler for new users:

```
const hasProfile = await idos.hasProfile(signer.address) // true if there is an idOS profile associated with the passed adddress
```

### The `setSigner` flow and supported wallets

```js
const { humanId } = await idos.setSigner("EVM", signer);
```

All queries to idOS nodes require a valid signature. These are performed by your user's wallet, whose signer must be passed to the SDK via the `setSigner` method. During the `.setSigner` process, the SDK will endeavour to remember or learn two things:

1. a public key for this signer;
2. the idOS human ID of the user controlling this signer.

The SDK first attempts to recall both from local storage and from the secure enclave. If it can't, it will engage with the signer. In this scenario, the SDK first requests a signed message from which it can extract the public key. Finally, it performs the first idOS query: asking it for the ID of the user controlling the signer.

Your user's wallet will be triggered when this happens, so you should be mindful of when in your user's journey you call this method. Here's how these requests appear in MetaMask.

<table border="0"><tr align="center">
  <td><i>Asking the signer for a public key:</i></td>
  <td><i>Fetching the human ID from idOS:</i></td>
</tr><tr align="center">
  <td><img src="./assets/readme-sign-1.png" width="250" /></td>
  <td><img src="./assets/readme-sign-2.png" width="250" /></td>
</td></tr></table>

The idOS currently supports two classes of signers:

- Ethereum/EVM wallets (like MetaMask or Trust Wallet) producing [EIP-191](https://eips.ethereum.org/EIPS/eip-191) `secp256k1` signatures (aka `personal_sign`)
- NEAR/NVM wallets (like MyNearWallet or Meteor) producing [NEP-413](https://github.com/near/NEPs/blob/master/neps/nep-0413.md) `ed25519` signatures (aka `signMessage`)

### Unlocking the idOS enclave

Most data stored in the idOS is encrypted such that only its owner (your user) can make sense of it. Since key management is neither a common nor an expectable practice among non-technical folks, this key is derived from the user's password/passkey. The key derivation process is handled by the idOS secure enclave to enable users to perform [authenticated asymmetric ECC encryption / decryption](https://cryptobook.nakov.com/asymmetric-key-ciphers/elliptic-curve-cryptography-ecc#curve25519-x25519-and-ed25519).

Since the SDK does have access to this key, it delegates decryption workloads to the enclave when responding to data requests involving. This happens transparently when you use the SDK to read encrypted data from the idOS.

After the user clicks the **🔓 Unlock idOS** button, a secure dialog opens for the user to choose their preferred unlocking method.

<table border="0"><tr align="center"><td>
  <i>The unlock dialog</i>
</td></tr><tr align="center"><td>
  <img src="./assets/readme-auth-dialog.png" width="250" />
</td></tr></table>

If the user chooses **Password**, they'll be prompted to enter it.

<table border="0"><tr align="center"><td>
  <i>The password dialog</i>
</td></tr><tr align="center"><td>
  <img src="./assets/readme-dialog-password.png" width="250" />
</td></tr></table>

If they choose **Passkey**, we'll use their platform authenticator (you can learn more about passkeys [here](https://developers.google.com/identity/passkeys)).

<table border="0"><tr align="center"><td>
  <i>A passkey dialog</i>
</td></tr><tr align="center"><td>
  <img src="./assets/readme-dialog-passkey.png" width="250" />
</td></tr></table>

The selected auth method will be stored and will be reused until it is not explicitly removed:

```js
import { idOS } from "@idos-network/idos-sdk";
idos = await idOS.init({ container: "css selector" });

await idos.store.reset() // This clears the idOS information from the storage.
```

## Quick reference

### Importing and initializing

```js
import { idOS } from "@idos-network/idos-sdk";

idos = await idOS.init({ container: "css selector" });
```

### EVM signer setup

```js
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

const { humanId } = await idos.setSigner("EVM", signer);
```

### NEAR signer setup

```js
const { defaultContractId: contractId, contractMethods: methodNames, defaultNetwork: network } = idOS.near;

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

const { humanId } = await idos.setSigner("NEAR", signer);
```

### idOS profile

```js
if (humanId) {
  /* user has an idOS profile */
}
```

You can also use `idos.hasProfile(signer.address)` before `setSigner` for a check that won't require a signature.

If your user does not have an idOS profile, you can send them to Fractal ID for them to get one, by redirecting them to the first URL in `idOS.profileProviders`. By using that URL, you agree to [Fractal ID's Terms of Service](https://web.fractal.id/wp-content/uploads/2023/11/Onboarding-link.pdf).

```js
if (!idos.hasProfile(signer.address)) window.location = idOS.profileProviders[0];
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


### Access Grants

An Access Grant is a record in the blockchain that consists of the following values:
* `owner`: the grant owner (in ETH chain this is the owners wallet address, for Near this is the owners full access public key).
* `grantee`: the grant grantee (in ETH chain this is the grantee wallet address, for Near this is the grantee full access public key).
* `dataId`: the `id` of the duplicated record (i.e credential) that is going to be shared.
* `lockedUntil`: the span of time during which the AG can not be revoked.


### Access Grant creation / revocation / list

For EVM wallets, the access grant is created by invoking the `insertGrant` contract action, where the grant owner is the user who signed the transaction.
For EVM wallets, the access grant is revoked by invoking the `deleteGrant` contract action, where the grant owner is the user who signed the transaction.
You can en example of a contract [here](https://sepolia.etherscan.io/address/0x1673b9fd14c30332990314d99826f22a628a2601#code)

```js
// Share a credential by creating an access grant
await idos.grants.create('credential', credential.id, grantee, timelock, receiverPublicKey)
    
// Revoke an access grant
await idos.grants.revoke('credentials', recordId, grantee, dataId, timelock)

// List all grants that match a criteria
await idos.grants.list({
    owner,
    dataId,
    grantee
})

```
When creating an access grant some things happen under the hood:
* A duplicate of the underlying data is created, encrypted to the provided `receiverPublicKey`
* An access grant is created on the connected chain

The access grant can be revoked only once its timelock has expired.

> [!TIP]
> See a working example [idos-example-dapp](../../apps/idos-example-dapp)


### Delegated Access Grants

A Delegated Access Grant (DAG) is a way of creating / revoking an Access Grant by the user delegating the operations to a third party (dApp) by signing a special type of message.
The Access Grant will be created for the user that signed the message (not for the dApp which calls the `insert_grant_by_signature` contract method).

The interface for creating a DAG is the same as the one for creating an Access Grant:

```js
// Share a credential by creating a DAG
idos.grants.create('credential', credential.id, grantee, timelock, receiverPublicKey)

// Revoke an access grant
idos.grants.revoke('credentials', recordId, grantee, dataId, timelock)
```
