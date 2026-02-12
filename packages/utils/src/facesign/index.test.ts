import tweetnacl from "tweetnacl";
import { describe, expect, it } from "vitest";
import { mnemonicToSeed } from "web-bip39";
import { utf8Encode } from "../codecs/index.js";
import { mnemonicToKeyPair } from "./index.js";

describe("mnemonicToKeyPair", () => {
  const mnemonic =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

  it("derives a deterministic key pair from a mnemonic string", async () => {
    const keyPair = await mnemonicToKeyPair(mnemonic);
    const seed = await mnemonicToSeed(mnemonic);
    const expected = tweetnacl.sign.keyPair.fromSeed(seed.subarray(0, 32));

    expect(keyPair.publicKey).toEqual(expected.publicKey);
    expect(keyPair.secretKey).toEqual(expected.secretKey);
  });

  it("accepts Uint8Array input and matches string result", async () => {
    const stringKeyPair = await mnemonicToKeyPair(mnemonic);
    const bytesKeyPair = await mnemonicToKeyPair(utf8Encode(mnemonic));

    expect(bytesKeyPair.publicKey).toEqual(stringKeyPair.publicKey);
    expect(bytesKeyPair.secretKey).toEqual(stringKeyPair.secretKey);
  });
});
