// cspell:ignore selfcheck
/**
 * Runnable check for add-wallet popup request binding and connector storage reset.
 *
 *   node --experimental-strip-types apps/embedded-wallet/src/add-wallet-popup.selfcheck.ts
 */
import assert from "node:assert/strict";

import { isSignAddWalletForAttempt, readAddWalletRequest } from "./add-wallet-request.ts";
import { clearConnectorPersistence, isConnectorStorageKey } from "./connector-persistence.ts";
import { shouldAdvanceAfterConnect } from "./fresh-connection.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";

const params = new URLSearchParams({
  user_id: userId,
  request_id: requestId,
});

const request = readAddWalletRequest(`?${params.toString()}`);
assert.ok(request);
assert.equal(request.userId, userId);
assert.equal(request.requestId, requestId);

const swapped = new URLSearchParams(params);
swapped.set("user_id", "33333333-3333-4333-8333-333333333333");
assert.equal(readAddWalletRequest(`?${swapped.toString()}`).userId, swapped.get("user_id"));
assert.equal(readAddWalletRequest("user_id=not-a-uuid&request_id=also-no"), null);
assert.equal(readAddWalletRequest(`?user_id=${userId}`), null);

const expected = { requestId, attemptId: "attempt-1" };
assert.equal(
  isSignAddWalletForAttempt(
    { type: "SIGN_ADD_WALLET", requestId, attemptId: "attempt-1" },
    expected,
  ),
  true,
);
assert.equal(
  isSignAddWalletForAttempt(
    { type: "SIGN_ADD_WALLET", requestId, attemptId: "attempt-2" },
    expected,
  ),
  false,
);
assert.equal(
  isSignAddWalletForAttempt(
    { type: "SIGN_ADD_WALLET", requestId: "other", attemptId: "attempt-1" },
    expected,
  ),
  false,
);
assert.equal(
  isSignAddWalletForAttempt({ type: "WALLET_READY", requestId, attemptId: "attempt-1" }, expected),
  false,
);

assert.equal(
  shouldAdvanceAfterConnect({ armed: true, wasConnected: false, connected: true }),
  true,
);
assert.equal(
  shouldAdvanceAfterConnect({ armed: false, wasConnected: false, connected: true }),
  false,
);
assert.equal(
  shouldAdvanceAfterConnect({ armed: true, wasConnected: true, connected: true }),
  false,
);

assert.equal(isConnectorStorageKey("@appkit/connection_status"), true);
assert.equal(isConnectorStorageKey("wagmi.store"), true);
assert.equal(isConnectorStorageKey("near-wallet-selector:selectedWalletId"), true);
assert.equal(isConnectorStorageKey("_meteor_wallet:default"), true);
assert.equal(isConnectorStorageKey("wc@2:client:0"), true);
assert.equal(isConnectorStorageKey("idos-unrelated"), false);

const store = new Map<string, string>([
  ["@appkit/connections", "connected"],
  ["wagmi.store", "{}"],
  ["theme", "dark"],
]);
const storage = {
  get length() {
    return store.size;
  },
  key(index: number) {
    return [...store.keys()][index] ?? null;
  },
  removeItem(key: string) {
    store.delete(key);
  },
};
clearConnectorPersistence(storage);
assert.deepEqual([...store.keys()], ["theme"]);
