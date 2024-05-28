# idOS e2e testubg

e2e testing for the [`📁 idos-sdk-js`](./packages/idos-sdk-js/)

## Running tests.
In order for the tests to run properly you need to provide the following .env variables:

-`BASE_URL` with the domain against which tests will run

The following .env variables should be from an EVM wallet (MetaMask)
- `WALLET_SEED_PHRASE` - the wallet secret phrase
- `WALLET_PASSWORD` - the wallet password
```
export BASE_URL=https://some.test.url

Build the wallet cache:
```
npx synpress tests/wallet-setup
```
This will build a wallet cache needed for our tests.
```
Run the tests:
```
pnpm test:e2e
```

