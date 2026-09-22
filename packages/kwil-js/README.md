# Kwil

This is a forked version from `@trufnetwork/kwil-js` that adds support for XRPL keys.

Kwil-JS is a JavaScript/Typescript SDK for building browser and NodeJS applications to interact with Kwil databases.

## Version Compatibility

Make sure to use the correct version of the Kwil-JS SDK for the version of the [Kwil-DB](https://github.com/trufnetwork/kwil-db/tags) you are using:

| Kwil-JS Version | Kwil-DB Version |
| :-------------: | :-------------: |
|      v0.9       |      v0.10      |
|      v0.8       |      v0.9       |
|      v0.7       |      v0.8       |

## Installation

```bash
pnpm i @trufnetwork/kwil-js ethers
```

## Initialization

Configure your `NodeKwil` or `WebKwil` class by providing the required configurations and any [optional configurations](https://docs.kwil.com/docs/sdks/js-ts/overview#optional-configuration).

### Browser

```javascript
import { BrowserProvider } from 'ethers';
import { WebKwil } from '@trufnetwork/kwil-js';

// to be used for funding and signing transactions
const provider = new BrowserProvider(window.ethereum);

const kwil = new WebKwil({
  kwilProvider: 'kwil_provider_endpoint',
  chainId: 'your_kwil_chain_id',
});
```

### NodeJS

```javascript
const { Wallet } = require('ethers');
const kwiljs = require('@trufnetwork/kwil-js');

// to be used for signing transactions
// instead of a provider, nodeJS requires a wallet
const wallet = new Wallet('my_ethereum_private_key');

const kwil = new kwiljs.NodeKwil({
  kwilProvider: 'kwil_provider_endpoint',
  chainId: 'your_kwil_chain_id',
});
```

## Identifiers

### Account Identifiers

In Kwil, accounts are identified by the signer(s) that are used on the Kwil Network. Kwil natively supports two types of signers: Secp256k1 (EVM) and ED25519.

Secp256k1 signers use **Ethereum wallet addresses** as identifiers. ED25519 signers use the **ED25519 public key** as identifiers.

## Signers

Certain operations in Kwil require signature authentication from the user (e.g. execute action, INSERT/UPDATE/DELETE/CREATE/DROP, transfer funds, etc).

To manage signing, Kwil-JS uses a `KwilSigner` class. Out of the box, Kwil-JS supports signers from [ethers.js](https://github.com/ethers-io/ethers.js) (v5 and v6). You can also pass a custom signing callback function (see [below](#custom-signers)).

The account identifier can be passed as a hex string or as bytes.

### Browser

```javascript
import { KwilSigner } from '@trufnetwork/kwil-js';
import { BrowserProvider } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// get ethereum address
const identifier = await signer.getAddress();

// create kwil signer
const kwilSigner = new KwilSigner(signer, identifier);
```

### NodeJS

```javascript
import { KwilSigner } from '@trufnetwork/kwil-js';
import { Wallet } from 'ethers';

const signer = new Wallet('my_ethereum_private_key');
const identifier = await signer.getAddress();

// create kwil signer
const kwilSigner = new KwilSigner(signer, identifier);
```

## Writing Data

To write data on Kwil, you can (1) execute an ad-hoc SQL query or (2) execute an action.

### Ad-Hoc SQL

If the signer has the required permissions, they can execute ad-hoc SQL queries on the database.

```javascript
const res = await kwil.execSql(
  'INSERT INTO users (name, age) VALUES ($name, $age)',
  {
    $name: 'John Doe',
    $age: 30,
  },
  kwilSigner,
  true // set to true to wait for the transaction to be confirmed
);

/*
    res.data = {
        tx_hash: "hash",
    }
*/
```

### Executing Actions

Actions are pre-defined operations that can be executed on the database.

You can bulk execute an action by passing an array of objects to the `inputs` field (to name each parameter), or an array of tuples (for unnamed parameters).

To execute an action once, pass only one tuple to the inputs array.

```javascript
const res = await kwil.execute(
    {
        namespace: 'db_namespace' // e.g., 'main',
        name: 'action_name', // e.g., 'create_user',
        // execute the same action two times:
        inputs: [
            ['iter_1_value_1', 'iter_1_value_2', 'iter_1_value_3'],
            ['iter_2_value_1', 'iter_2_value_2', 'iter_2_value_3'],
        ],
        description: 'Click sign to execute'
    },
    kwilSigner,
    true // set to true to wait for the transaction to be confirmed
)

/*
    res.data = {
        tx_hash: "hash",
    }
*/
```

## Reading Data

To read data on Kwil, you can (1) execute ad-hoc SELECT queries or (2) call view actions.

### Ad-Hoc SELECT Queries

```javascript
const res = await kwil.selectQuery('SELECT * FROM users WHERE age > $age', {
  $age: 30,
});

/*
    res.data = [
        ...
    ]
*/
```

### View Actions

View actions are read-only actions that return data without having to wait for a transaction to be mined on Kwil.

If the `view` action uses a `@caller` contextual variable, you must pass a `KwilSigner` as the second argument to the `kwil.call()` method to identify the caller.

```javascript
const res = await kwil.call(
  {
    namespace: 'db_namespace',
    name: 'action_name',
    inputs: ['input_value_1', 'input_value_2'],
  },
  kwilSigner
);
```

## Database Info

### ChainID and Status

To verify that you are using the correct `chainId`, as well as the latest block height and block hash on your chain, you can call the `.chainInfo()` method.

```javascript
const res = await kwil.chainInfo();

/*
    res.data = {
        chain_id: "your_chain_id",
        height: "latest_block_height",
        hash: "latest_block_hash"
    }
*/
```

### Get Account

You can get the nonce and balance of an account by using the `.getAccount()` method. `.getAccount()` takes an account identifier, either in hex format or bytes (Uint8Array).

If you are using a custom signer, you should pass the signer's enumerator as the second argument.

```javascript
// using secp256k1 (Ethereum) signer or ed25519 signer
const res = await kwil.getAccount('account_identifier');

// using custom signer
const res = await kwil.getAccount('account_identifier', 'custom_signer_enumerator');

/*
    res.data = {
        identifier: Uint8Array,
        balance: "some_balance",
        nonce: "some_nonce"
    }
*/
```

## Advanced Usage

### Overriding Action Input Types

By default, kwil-js will attempt to infer the input types of the action being executed. If you wish to override this behavior (for example, to store a string that looks like a uuid in a `text` column), you can add an additional field to the `actionBody` or `CallBody` object.

The examples below show how to override the input types for executing an action; however, viewing actions can also be overridden in the same way.

Using named inputs:

```javascript
import { Utils } from '@trufnetwork/kwil-js';
const { DataType } = Utils;

const body = {
    namespace: 'db_namespace',
    name: 'action_name',
    inputs: [
        { $name: 'input_name', $id: 'some_uuid_value'}
    ]
    // optional: override input types
    types: { $name: DataType.Text, $value: DataType.Uuid }
}

await kwil.execute(body, kwilSigner);
```

Using positional inputs:

```javascript
import { Utils } from '@trufnetwork/kwil-js';
const { DataType } = Utils;

const body = {
    namespace: 'db_namespace',
    name: 'action_name',
    inputs: ['some_text_value', 'some_uuid_value']
    // optional: override input types
    types: [DataType.Text, DataType.Uuid]
}

await kwil.execute(body, kwilSigner);
```

### Custom Signers

If you wish to sign with something other than an EtherJS signer, you may pass a callback function that accepts and returns a `Uint8Array()` and the enumerator for the signature type used.

Currently, Kwil supports two signature types:

| Type      | Enumerator  | Identifier              | Description                                                |
| :-------- | :---------: | ----------------------- | ---------------------------------------------------------- |
| Secp256k1 | 'secp256k1' | Ethereum Wallet Address | The Kwil Signer will use Ethereum Personal Sign (EIP-191). |
| ED25519   |  'ed25519'  | ED25519 Public Key      | The Kwil Signer will use an ED25519 signature.             |

To use an ED25519 signature:

```javascript
import nacl from 'tweetnacl';
import { KwilSigner } from '@trufnetwork/kwil-js';

// create keypair and signer
const keys = nacl.sign.keyPair();
const customSigner = (msg) => nacl.sign.detached(msg, keys.secretKey);
const identifier = keys.publicKey;

const kwilSigner = new KwilSigner(customSigner, identifier, 'ed25519');
```

### Private Mode

Private RPC is a server-side configuration in kwild that enforces user authentication for each call request. Learn more about private mode [here](https://docs.kwil.com/docs/node/private-rpc).

```typescript
const body: CallBody = {
  namespace,
  name: 'your_action_name',
  inputs: ['input_value_1', 'input_value_2'],
};

// pass body AND kwilSigner if in Private Mode
const res = await kwil.call(body, kwilSigner);
```

### Kwil Gateway Authentication

Kwil Gateway is an optional service on Kwil networks that allows for authenticating users with their signatures for read queries / view procedures.
Learn more about the Kwil Gateway here.

```javascript
// pass KwilSigner to the call method
const res = await kwil.call(body, kwilSigner);

/*
    res.data = {
        result: [ query results ],
    }
*/
```

### Gateway logout

To log out of the Kwil Gateway, you can call the `kwil.auth.logoutKGW()` method. This is useful if you want to switch accounts or remove the authentication cookie.

```javascript
await kwil.auth.logoutKGW();
```
