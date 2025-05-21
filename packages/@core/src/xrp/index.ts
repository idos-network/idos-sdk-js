import type * as GemWalletAPI from "@gemwallet/api";
import invariant from "tiny-invariant";
import type { Xumm } from "xumm";
import { getXamanPublicKey } from "./xaman-wallet";

export type WalletType = "XAMAN" | "GEM";

export interface WalletConfig {
  type: WalletType;
  instance: Xumm | typeof GemWalletAPI;
}

export type XamanConfig = {
  type: "XAMAN";
  instance: Xumm;
};

export type GemConfig = {
  type: "GEM";
  instance: typeof GemWalletAPI;
};

export type WalletInitConfig = XamanConfig | GemConfig;

type XrpSignerWallet = {
  publicKey: string;
  sign?: (message: string) => Promise<unknown>;
};

type WalletConfigMap = {
  XAMAN: XamanConfig;
  GEM: GemConfig;
};

export async function createXrpSigner<T extends WalletType>(
  config: WalletConfigMap[T],
): Promise<XrpSignerWallet> {
  if (config.type === "XAMAN") {
    await config.instance.authorize();
    return {
      publicKey: await getXamanPublicKey(config.instance),
      // sign: config.instance.sign,
    };
  }
  if (config.type === "GEM") {
    const {
      result: { isInstalled },
    } = await config.instance.isInstalled();
    invariant(isInstalled, "Gem is not installed");
    const { result } = await config.instance.getPublicKey();
    invariant(result, "Gem is not connected");
    return {
      publicKey: result.publicKey,
      sign: (message: string) => config.instance.signMessage(message),
    };
  }
  throw new Error("Invalid wallet config type");
}
