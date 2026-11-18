import { watchAccount } from "@wagmi/core";
import { fromCallback } from "xstate";

import { wagmiConfig } from "@/core/wagmi";

import type { DashboardEvent, WatchEvmAccountInput } from "../dashboard/machine";

// Disconnect when the EVM wallet switches (or drops) the account the dashboard is logged in with
export const watchEvmAccount = fromCallback<DashboardEvent, WatchEvmAccountInput>(
  ({ input, sendBack }) => {
    const { walletType, walletAddress } = input;
    if (walletType !== "EVM" || !walletAddress) {
      return;
    }

    return watchAccount(wagmiConfig, {
      onChange(account) {
        if (account.status === "connecting" || account.status === "reconnecting") {
          return;
        }
        if (account.address?.toLowerCase() !== walletAddress.toLowerCase()) {
          sendBack({ type: "DISCONNECT" });
        }
      },
    });
  },
);
