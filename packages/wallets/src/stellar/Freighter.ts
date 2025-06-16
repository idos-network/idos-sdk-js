import { StrKey } from "@stellar/stellar-sdk";
import { Wallet } from "../types";
import pkg from '@stellar/freighter-api';
const {isConnected, isAllowed, requestAccess, signMessage, setAllowed } = pkg;

export default class Freighter extends Wallet {
  static isAvailable(): Promise<boolean> {
    return isConnected().then((res) => res.isConnected);
  }

  static async init(): Promise<Freighter[]> {
    const isAppAllowed = await isAllowed();

    if (!isAppAllowed) {
      const isAppAllowed = await setAllowed();

      if (!isAppAllowed) {
        throw new Error("Freighter is not allowed");
      }
    }

    // Get public key
    const accessObj = await requestAccess();

    if (accessObj.error) {
      throw new Error(accessObj.error);
    }

    const address = accessObj.address;

    // @ts-expect-error This is wrongly typed
    const publicKey = StrKey.encodeEd25519PublicKey(address);

    return [
      new Freighter("stellar", "freighter", address, publicKey, 1, async (message: string) => {
        const signedMessage = await signMessage(message);
        return signedMessage.signedMessage as string;
      })
    ];
  }
}