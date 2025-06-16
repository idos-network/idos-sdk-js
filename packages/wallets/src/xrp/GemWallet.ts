import { getAddress, getPublicKey, isInstalled, signMessage } from "@gemwallet/api";
import { Wallet } from "../types";

export default class GemWallet extends Wallet {
  static isAvailable(): Promise<boolean> {
    return isInstalled().then((res) => res.result.isInstalled);
  }

  static async init(): Promise<GemWallet[]> {
    const address = await getAddress().then((res) => res.result?.address);
    const publicKey = await getPublicKey().then((res) => res.result?.publicKey);

    if (!address || !publicKey) {
      throw new Error("GemWallet is not available");
    }

    console.log("address", address);
    console.log("publicKey", publicKey);

    return [
      new GemWallet("xrp", "gemwallet", address, publicKey, 1, async (message: string) => {
        const signedMessage = await signMessage(message);
        console.log("signedMessage", signedMessage);
        return signedMessage.result?.signedMessage as string;
      }),
    ];
  }
}
