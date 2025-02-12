# idOS e2e testing

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

Install playwright
```bash
npx playwright install
```


Build the wallet cache:
```bash
npx synpress wallet-setup
```

This will build a wallet cache needed for our tests.

Run all tests:
```bash
pnpm test:e2e
```

Run a particilar test:
```bash
pnpm test:e2e 01-evm-auth.spec.ts
```

