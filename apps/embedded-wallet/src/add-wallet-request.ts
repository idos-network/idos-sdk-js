const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AddWalletRequest = {
  userId: string;
  requestId: string;
};

function isUuid(value: string | null): value is string {
  return value !== null && UUID_PATTERN.test(value);
}

export function isSignAddWalletForAttempt(
  data: { type?: unknown; requestId?: unknown; attemptId?: unknown } | null | undefined,
  expected: { requestId: string; attemptId: string },
): boolean {
  return (
    data?.type === "SIGN_ADD_WALLET" &&
    data.requestId === expected.requestId &&
    data.attemptId === expected.attemptId
  );
}

export function readAddWalletRequest(search: string): AddWalletRequest | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const userId = params.get("user_id");
  const requestId = params.get("request_id");
  if (!isUuid(userId) || !isUuid(requestId)) return null;
  return { userId, requestId };
}
