import { defineWalletSetup } from "@synthetixio/synpress-cache";
import { MetaMask } from "@synthetixio/synpress/playwright";
// Define a test seed phrase and password
export const SEED_PHRASE =
	"yard hope cherry manage shop occur depart shoot local grit truth method";
export const PASSWORD = "752@hi-bsc";

// Define the basic wallet setup
export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
	// Create a new MetaMask instance
	const metamask = new MetaMask(context, walletPage, PASSWORD);

	// Import the wallet using the seed phrase
	await metamask.importWallet(SEED_PHRASE);

	// Additional setup steps can be added here, such as:
	// - Adding custom networks
	// - Importing tokens
	// - Setting up specific account states
});
