import type { WalletType } from "@idos-network/kwil-infra/actions";

import { isSignAddWalletForAttempt, readAddWalletRequest } from "./add-wallet-request";
import { getConfig } from "./config";

export type ChainSignMessage = {
  message: string;
  notBefore: string;
  notAfter: string;
  attemptId: string;
};

const SIGN_TIMEOUT_MS = 60_000;

// The dashboard calls add_wallet_message after it learns the connected address.
// Sign only the reply for this attempt, and only when it comes from the opener on the dashboard origin.
export function requestChainSignMessage(params: {
  address: string;
  walletType: WalletType;
}): Promise<ChainSignMessage> {
  const request = readAddWalletRequest(window.location.search);
  const { dataDashboardUrl } = getConfig();
  if (!request || !window.opener || !dataDashboardUrl) {
    return Promise.reject(new Error("Add-wallet request is missing"));
  }

  const dashboardOrigin = new URL(dataDashboardUrl).origin;
  const opener = window.opener as Window;
  const attemptId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("Timed out waiting for the add-wallet message"));
    }, SIGN_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== dashboardOrigin || event.source !== opener) return;
      if (!isSignAddWalletForAttempt(event.data, { requestId: request.requestId, attemptId })) {
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
      resolve({ message, notBefore, notAfter, attemptId });
    };

    window.addEventListener("message", onMessage);
    opener.postMessage(
      {
        type: "WALLET_READY",
        requestId: request.requestId,
        userId: request.userId,
        attemptId,
        address: params.address,
        walletType: params.walletType,
      },
      dashboardOrigin,
    );
  });
}
