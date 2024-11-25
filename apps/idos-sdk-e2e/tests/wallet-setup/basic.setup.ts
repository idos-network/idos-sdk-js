import { defineWalletSetup } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures, getExtensionId } from "@synthetixio/synpress/playwright";

export const SEED_PHRASE =
  "yard hope cherry manage shop occur depart shoot local grit truth method";
export const PASSWORD = "752@hi-bsc";

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const extensionId = await getExtensionId(context, "MetaMask");

  const metamask = new MetaMask(context, walletPage, PASSWORD, extensionId);

  await metamask.importWallet(SEED_PHRASE);
  // Add a new account that doesn't exist in the idOS.
  await metamask.addNewAccount("Pristine");
});
