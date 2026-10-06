// cspell:ignore selfcheck
/**
 *   node --experimental-strip-types apps/idos-data-dashboard/src/lib/evm-public-key.selfcheck.ts
 */
import assert from "node:assert/strict";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { evmPublicKeyFromSignature } from "./evm-public-key.ts";

const account = privateKeyToAccount(generatePrivateKey());
const message = "Sign this message to add this wallet to your idOS profile";
const signature = await account.signMessage({ message });
const publicKey = await evmPublicKeyFromSignature(message, signature);

assert.equal(publicKey.toLowerCase(), account.publicKey.toLowerCase());
assert.equal((publicKey.length - 2) / 2, 65);
