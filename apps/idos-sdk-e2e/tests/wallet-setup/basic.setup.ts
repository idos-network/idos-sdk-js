// import { defineWalletSetup } from "@synthetixio/synpress-cache";
// import { MetaMask } from "@synthetixio/synpress/playwright";

// const SEED_PHRASE = process.env.WALLET_SEED_PHRASE;
// const PASSWORD = process.env.WALLET_PASSWORD;
// const WALLET_PK = process.env.WALLET_PK;

// export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
//   const metamask = new MetaMask(context, walletPage, PASSWORD);

//   // Import the wallet using the seed phrase
//   await metamask.importWallet(SEED_PHRASE);
//   await metamask.importWalletFromPrivateKey(WALLET_PK);
//   // Add a new account that doesn't exist in the idOS.
//   // await metamask.addNewAccount("Pristine");
// });
