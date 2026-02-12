import { describe, expect, it } from "vitest";
import { hexEncode, utf8Encode } from "../codecs/index.js";
import { mnemonicToKeyPair } from "./index.js";

describe("mnemonicToKeyPair", () => {
  const mnemonic =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const expectedPublicKeyHex = "c5785e1865b708938aff8161d573006496663b1aa10834e396dc566869a2c66a";
  const expectedSecretKeyHexPrefix =
    "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1";

  it("derives a deterministic key pair from a mnemonic string", async () => {
    const keyPair = await mnemonicToKeyPair(mnemonic);

    expect(hexEncode(keyPair.publicKey).toLowerCase()).toBe(expectedPublicKeyHex.toLowerCase());
    expect(
      hexEncode(keyPair.secretKey)
        .toLowerCase()
        .startsWith(expectedSecretKeyHexPrefix.toLowerCase()),
    ).toBe(true);
  });

  it("accepts Uint8Array input and matches string result", async () => {
    const stringKeyPair = await mnemonicToKeyPair(mnemonic);
    const bytesKeyPair = await mnemonicToKeyPair(utf8Encode(mnemonic));

    expect(bytesKeyPair.publicKey).toEqual(stringKeyPair.publicKey);
    expect(bytesKeyPair.secretKey).toEqual(stringKeyPair.secretKey);
  });
});
