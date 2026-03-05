import {
  FREIGHTER_ID,
  FreighterModule,
  StellarWalletsKit,
  WalletNetwork,
  xBullModule,
} from "@creit.tech/stellar-wallets-kit";
import { COMMON_ENV } from "./envFlags.common";

const stellarKit: StellarWalletsKit = new StellarWalletsKit({
  network: COMMON_ENV.DEV ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule(), new xBullModule()],
});

export default stellarKit;
