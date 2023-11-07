import { idOS as idOSSDK } from "@idos-network/idos-sdk";
import { Network, setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

export const setupNearWalletSelector = async () => {
  return await setupWalletSelector({
    network: idOSSDK.near.defaultNetwork as unknown as Network,
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()]
  });
};
