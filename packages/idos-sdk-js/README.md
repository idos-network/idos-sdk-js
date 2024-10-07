# idOS JavaScript SDK

[![NPM](https://img.shields.io/npm/v/@idos-network/idos-sdk?logo=npm)](https://www.npmjs.com/package/@idos-network/idos-sdk) ![License](https://img.shields.io/badge/license-MIT-blue?&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NHB4IiBoZWlnaHQ9IjY0cHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGcgaWQ9IlNWR1JlcG9fYmdDYXJyaWVyIiBzdHJva2Utd2lkdGg9IjAiPjwvZz48ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjwvZz48ZyBpZD0iU1ZHUmVwb19pY29uQ2FycmllciI+IDxwYXRoIGQ9Ik0xNiAxNmwzLTggMy4wMDEgOEE1LjAwMiA1LjAwMiAwIDAxMTYgMTZ6Ij48L3BhdGg+IDxwYXRoIGQ9Ik0yIDE2bDMtOCAzLjAwMSA4QTUuMDAyIDUuMDAyIDAgMDEyIDE2eiI+PC9wYXRoPiA8cGF0aCBkPSJNNyAyMWgxMCI+PC9wYXRoPiA8cGF0aCBkPSJNMTIgM3YxOCI+PC9wYXRoPiA8cGF0aCBkPSJNMyA3aDJjMiAwIDUtMSA3LTIgMiAxIDUgMiA3IDJoMiI+PC9wYXRoPiA8L2c+PC9zdmc+Cg==)

## Installation

Get [our NPM package](https://www.npmjs.com/package/@idos-network/idos-sdk) and its dependencies with pnpm or the equivalent of your package manager of choice:
```
pnpm add @idos-network/idos-sdk ethers near-api-js
```

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

> 🛈 Note
>
> For more examples and data queries, see:
>
> - the [quick reference](#quick-reference) below
> - [`📁 idos-example-dapp`](https://github.com/idos-network/idos-sdk-js/tree/main/apps/idos-example-dapp) for a simple implementation
> - [`📁 idos-data-dashboard`](https://github.com/idos-network/idos-sdk-js/tree/main/apps/idos-data-dashboard) for a thorough example

> 💡 Tip
>
> Need support? Please follow [this process](https://github.com/idos-network/.github/blob/main/profile/README.md).

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

Our [`📁 idos-example-dapp`](https://github.com/idos-network/idos-sdk-js/tree/main/apps/idos-example-dapp) shows an example of blending this into a UI. It wraps the container and floats it over the page, and animates its opacity when the `visible` class is applied. You can see it below (pulsating forcefully to illustrate the point):

<img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-container-2.gif" />

The main reason the SDK controls this HTML element is to remove the burden of opening up a new top-level window without being blocked because it was identified as an unwanted pop-up. Since all SDK users would need to go through the delicate procress of getting this minutiae right, we implemented it in the SDK.

### Other initialization options

The enclaveOptions's container is the only required option, but there are a few other aspects of the SDK you're able to control during initialization.

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

This concept is very internal to the idOS nodes, and the right value gets automatically disovered during initialization.

Unless you know what you're doing (e.g., deploying a new idOS network with a Kwil schema that's not called `idos`), omit this field.

#### Grant options (`evmGrantsOptions` and `nearGrantsOptions`)

This is only relevant if you use `idos.grants.*` methods.

In order for the SDK to know which access grants contract to use, we need to provide `evmGrantsOptions` or `nearGrantsOptions`, depending on which network the dApp is deployed on.

The default values come from the [.env] file the SDK is build with. Assuming that file is available as a gloab `env` object, here are the default values for each options object:

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

You can take a look at what each environment uses by consulting their schemas:
- [schema.production.kf](https://github.com/idos-network/idos-schema/blob/main/schema.production.kf)
- [schema.playground.kf](https://github.com/idos-network/idos-schema/blob/main/schema.playground.kf)

#### `enclaveOptions`

So far, we've only used `container` from `enclaveOptions`. There are a few more fields that you can set:

- `theme?: "light" | "dark"`: Forces a specific theme for the enclave pop-up. By default, this is discovered through the media query `prefers-color-scheme`.
- `mode?: "new" | "existing"`: Forces a specific verbiage to be shown on the enclave pop-up. The default is `existing`, but issuers can set it to `new` to show messages that are more helful for new users. Unless you're an issuer, this should not be supplied.
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

Besides `hasProfile`, all other queries to idOS nodes require a valid signature. These are performed by your user's wallet, whose signer must be passed to the SDK via the `setSigner` method. During the `setSigner` process, the SDK will endeavour to remember or learn two things:

1. a public key for this signer;
2. the idOS human ID of the user controlling this signer.

The SDK first attempts to recall both from local storage and from the secure enclave. If it can't, it will engage with the signer. In this scenario, the SDK first requests a signed message from which it can extract the public key. Finally, it performs the first idOS query: asking it for the ID of the user controlling the signer.

Your user's wallet will be triggered when this happens, so you should be mindful of when in your user's journey you call this method. Here's how these requests appear in MetaMask.

<table border="0"><tr align="center">
  <td><i>Asking the signer for a public key:</i></td>
  <td><i>Fetching the human ID from idOS:</i></td>
</tr><tr align="center">
  <td><img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-sign-1.png" width="250" /></td>
  <td><img src="https://raw.githubusercontent.com/idos-network/idos-sdk-js/main/packages/idos-sdk-js/assets/readme-sign-2.png" width="250" /></td>
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

### Filtering credentials

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

`entries` will be a list of credentials where the `"credentialSubject.identification_document_country"` is `"DE"`
and `"credentialSubject.identification_document_type"` is not `"passport"`.

You can also use `idos.grants.shareMatchingEntry`, a helper function that:
- Gets all the user's credentials
- Can filter by public fields
- Calls `idos.enclave.filterCredentials`
- Calls `idos.grants.create` with the first matching credential

### Access Grants

Acquiring an Access Grant assures a dApp that they'll have a copy of the user's data (either a credential or an attribute) until `lockedUntil` UNIX timestamp has passed. This is especially relevant to be able to fulfill compliance obligations.

This is achived by combining two mechanisms:

- On idOS,by asking the user to share a credential/attribute, which creates a copy of its current state, encrypted to the `receiverPublicKey` you provide. The id of this copy is commonly called `dataId`.
- On the blockchain you're using, by creating an Access Grant entry in a Smart Contract on the chain you're using.

The combination of doing these two operations is bundled in `idos.grants.create`, and that's the intended API for common usage.

An Access Grant record consists of the following values:

- `owner`: the grant owner (in ETH chain this is the owners wallet address, for Near this is the owners full access public key).
- `grantee`: the grant grantee (in ETH chain this is the grantee wallet address, for Near this is the grantee full access public key).
- `dataId`: the `id` of the duplicated record (i.e credential) that is going to be shared.
- `lockedUntil`: the earliest UNIX timestamp when the contract will allow the Access Grant to be revoked. "0" means it's revocable at any time.

> 💡 Tip
>
> See a working example [idos-example-dapp](https://github.com/idos-network/idos-sdk-js/tree/main/apps/idos-example-dapp)

### Delegated Access Grants

A delegated Access Grant (dAG) is a way of creating / revoking an Access Grant by somebody else other than the user. This is acomplished by getting the user's signature a specific message, generated with the contract's `insert_grant_by_signature_message` method, that can then be used to call the contract's `insert_grant_by_signature` method.

The message building is exposed as the `idos.grants.messageForCreateBySignature`. Submitting the resulting messages and its user signature is exposed as `idosGrantee.createBySignature`.

> 🛑 Caution
>
> This is not implemented for NEAR yet. If you want to use dAGs today, you'll have to call the right contract directly.

This is especially relevant for dApps who want to subsidise the cost of transaction necessary to create an AG.

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
const credentialId = credential.id;

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
  address as string,
  0,
  "zleIscgvb3usjyVqR4OweNM2oXwmzADJVO3g7byuGk8=",
  ),
});
```

### Creating a dAG on EVM

```js
/*
 * Client side.
 */

// Create a share (duplicate) in the idOS and get its id:
const { id: dataId } = await idos.data.share(tableName, recordId, receiverPublicKey);)

// Get a message that needs to be signed by the user:
const message = await idos.grants.messageForCreateBySignature({
  owner,
  grantee,
  dataId,
  lockedUntil
})

// The dApp should ask the user to sign this message:
const { signature } = await wallet.signMessage({ message, recipient, nonce });

/*
 * Server side.
 *
 * !! NOT IMPLEMENTED FOR NEAR YET !!
 */

// Initialise the idOSGrantee
const idosGrantee = await idOSGrantee.init({
  chainType: "EVM",
  granteeSigner: evmGranteeSigner,
  encryptionSecret: process.env.ENCRYPTION_SECRET_KEY
});

// Create the dAG
await idosGrantee.createBySignature({
  // These values need to be the same you used to generate the singed message
  owner,
  grantee,
  dataId,
  lockedUntil,
  // This is the signature you got from the user.
  signature,
})
```

## Developing the SDK locally

Create an `.env.local` file in the root folder of the SDK package and add the needed environment variables (you can reference .env.production for the variable names).

Run:
```
pnpm dev
```
This will run a dev server with watch mode that will rebuild every time any of the source files are changed.

You can also create a production build by running the following command in the root folder of the SDK package:
```
pnpm build
```
This will create a PRODUCTION build of the SDK using the `.env.production` file.
