// The embedded wallet signs this text only when the last two lines are
// `idOS profile: <user id>` and `Request: <request id>`.
export function addWalletMessage(userId: string, requestId: string): string {
  return [
    "Sign this message to prove you own this wallet.",
    `idOS profile: ${userId}`,
    `Request: ${requestId}`,
  ].join("\n");
}

export function walletSignatureMatchesRequest(
  payloadMessage: string,
  userId: string,
  requestId: string,
): boolean {
  return payloadMessage === addWalletMessage(userId, requestId);
}
