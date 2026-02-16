import {
  FREIGHTER_ID,
  FreighterModule,
  StellarWalletsKit,
  WalletNetwork,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";

const stellarKit: StellarWalletsKit = new StellarWalletsKit({
  // @todo: what is the correct network to use here?
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule(), new xBullModule()],
});

export default stellarKit;
