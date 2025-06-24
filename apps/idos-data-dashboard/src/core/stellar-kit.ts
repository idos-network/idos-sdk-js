import {
  FREIGHTER_ID,
  FreighterModule,
  StellarWalletsKit,
  WalletNetwork,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import { KwilSigner } from "@idos-network/core";

const stellarKit: StellarWalletsKit = new StellarWalletsKit({
  // @todo: pass ENV variable here
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule(), new xBullModule()],
});

export default stellarKit;

export const createStellarSigner = async (walletPublicKey: string, walletAddress: string) => {
  const stellarSigner = new KwilSigner(
    async (msg: Uint8Array): Promise<Uint8Array> => {
      const messageBase64 = Buffer.from(msg).toString("base64");
      const result = await stellarKit.signMessage(messageBase64);

      let signedMessage = Buffer.from(result.signedMessage, "base64");

      if (signedMessage.length > 64) {
        signedMessage = Buffer.from(signedMessage.toString(), "base64");
      }
      return signedMessage;
    },
    walletPublicKey as string,
    "ed25519",
  );
  // @ts-ignore
  stellarSigner.publicAddress = walletAddress;
  return stellarSigner;
};
