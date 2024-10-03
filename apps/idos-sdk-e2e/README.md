# idOS e2e testubg

e2e testing for the [`📁 idos-sdk-js`](./packages/idos-sdk-js/)

## Running tests.

In order for the tests to run properly you need to provide the following .env
variables:

- `BASE_URL` with the domain against which tests will run

The following .env variables should be from an EVM wallet (MetaMask)

- `WALLET_SEED_PHRASE` - the wallet secret phrase
- `WALLET_PASSWORD` - the wallet password

Here are some example values:

```
export BASE_URL=https://some.test.url
export WALLET_SEED_PHRASE=candy maple cake sugar pudding cream honey rich smooth crumble sweet treat
export WALLET_PASSWORD=hunter2
```

Build the wallet cache:

```
npx synpress tests/wallet-setup
```

This will build a wallet cache needed for our tests.

Run the tests:

```
pnpm test:e2e
```
