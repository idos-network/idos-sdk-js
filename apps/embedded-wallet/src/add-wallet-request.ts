const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AddWalletRequest = {
  userId: string;
  requestId: string;
  message: string;
};

function isUuid(value: string | null): value is string {
  return value !== null && UUID_PATTERN.test(value);
}

function canonicalAddWalletMessage(userId: string, requestId: string): string {
  return [
    "Sign this message to prove you own this wallet.",
    `idOS profile: ${userId}`,
    `Request: ${requestId}`,
  ].join("\n");
}

// The dashboard builds this message. Accept it only when the whole text matches.
export function readAddWalletRequest(search: string): AddWalletRequest | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const userId = params.get("user_id");
  const requestId = params.get("request_id");
  const message = params.get("message");
  if (!isUuid(userId) || !isUuid(requestId) || !message) return null;
  if (message !== canonicalAddWalletMessage(userId, requestId)) return null;
  return { userId, requestId, message };
}

export function currentSignMessage(): string {
  const request = readAddWalletRequest(window.location.search);
  if (!request) {
    throw new Error("Add-wallet request is missing");
  }
  return request.message;
}
