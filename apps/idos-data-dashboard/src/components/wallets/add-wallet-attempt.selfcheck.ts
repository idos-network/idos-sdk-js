// cspell:ignore selfcheck
/**
 *   node --experimental-strip-types apps/idos-data-dashboard/src/components/wallets/add-wallet-attempt.selfcheck.ts
 */
import assert from "node:assert/strict";

import { beginAddWalletAttempt, type AddWalletAttempt } from "./add-wallet-attempt.ts";

const first: AddWalletAttempt = { id: "a", address: "0x1", walletType: "EVM" };

const sameAddress = beginAddWalletAttempt(first, { id: "b", address: "0x1", walletType: "EVM" });
assert.equal(sameAddress.dropChain, false);
assert.equal(sameAddress.attempt.id, "b");

const otherAddress = beginAddWalletAttempt(first, { id: "c", address: "0x2", walletType: "EVM" });
assert.equal(otherAddress.dropChain, true);

const otherType = beginAddWalletAttempt(first, { id: "d", address: "0x1", walletType: "NEAR" });
assert.equal(otherType.dropChain, true);

const initial = beginAddWalletAttempt(null, first);
assert.equal(initial.dropChain, false);
assert.equal(initial.attempt, first);
