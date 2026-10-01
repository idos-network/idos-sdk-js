import type { WalletType } from "@idos-network/kwil-infra/actions";

import { readAddWalletRequest } from "./add-wallet-request";
import { COMMON_ENV } from "./components/envFlags.common";

export type ChainSignMessage = {
  message: string;
  notBefore: string;
  notAfter: string;
};

const SIGN_TIMEOUT_MS = 60_000;

// The dashboard calls add_wallet_message after it learns the connected address.
// Sign only that reply, and only when it comes from the opener on the dashboard origin.
export function requestChainSignMessage(params: {
  address: string;
  walletType: WalletType;
}): Promise<ChainSignMessage> {
  const request = readAddWalletRequest(window.location.search);
  if (!request || !window.opener || !COMMON_ENV.DATA_DASHBOARD_URL) {
    return Promise.reject(new Error("Add-wallet request is missing"));
  }

  const dashboardOrigin = new URL(COMMON_ENV.DATA_DASHBOARD_URL).origin;
  const opener = window.opener as Window;

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("Timed out waiting for the add-wallet message"));
    }, SIGN_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== dashboardOrigin || event.source !== opener) return;
      if (event.data?.type !== "SIGN_ADD_WALLET" || event.data.requestId !== request.requestId) {
        return;
      }
      const { message, notBefore, notAfter } = event.data as {
        message?: unknown;
        notBefore?: unknown;
        notAfter?: unknown;
      };
      if (
        typeof message !== "string" ||
        message.length === 0 ||
        typeof notBefore !== "string" ||
        typeof notAfter !== "string"
      ) {
        return;
      }
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve({ message, notBefore, notAfter });
    };

    window.addEventListener("message", onMessage);
    opener.postMessage(
      {
        type: "WALLET_READY",
        requestId: request.requestId,
        userId: request.userId,
        address: params.address,
        walletType: params.walletType,
      },
      dashboardOrigin,
    );
  });
}
