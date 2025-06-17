import { Wallet } from "../types";

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";

export default class Near extends Wallet {
  static isAvailable(): boolean {
    return true;
  }

  static async init(type: "meteor-wallet" | "here-wallet" | "my-near-wallet"): Promise<Near[]> {
    const walletSelector = await setupWalletSelector({
      network: "testnet",
      modules: [
        setupMeteorWallet(),
        setupHereWallet(),
        // @ts-expect-error Not fully typed
        setupMyNearWallet(),
      ],
    });

    const signingAdapter = await walletSelector.wallet(type);

    const nearInstance = new Near(
      "near",
      type,
      "waiting",
      "waiting",
      1,
      async (message: string) => {
        throw new Error("Not implemented");
      },
    );

    nearInstance.signMessageInternal = async (message: string) => {
      const data = await signingAdapter.signMessage({
        message,
        recipient: "idos.network",
        nonce: Buffer.from(message.substring(0, 32)),
      });

      if (data?.signature) {
        console.log("Near instance", nearInstance);
        nearInstance.address = data?.accountId;
        nearInstance.publicKey = data?.publicKey;
        console.log("Near instance", nearInstance);
        return data.signature;
      }

      throw new Error("No signature");
    };

    return [nearInstance];
  }
}
