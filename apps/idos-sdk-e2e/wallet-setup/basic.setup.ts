import { defineWalletSetup } from "@synthetixio/synpress-cache";
import { MetaMask, getExtensionId } from "@synthetixio/synpress/playwright";

const SEED_PHRASE = process.env.WALLET_SEED_PHRASE ?? "";
const PASSWORD = process.env.WALLET_PASSWORD ?? "";

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const extensionId = await getExtensionId(context, "MetaMask");
  const metamask = new MetaMask(context, walletPage, PASSWORD, extensionId);

  await metamask.importWallet(SEED_PHRASE);
  // Add a new account that doesn't exist in the idOS.
  await metamask.addNewAccount("Pristine");
});
