import { mnemonicToSeed, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import tweetnacl from "tweetnacl";
import { utf8Decode } from "../codecs";

export async function mnemonicToKeyPair(
  mnemonic: Uint8Array | string,
): Promise<tweetnacl.SignKeyPair> {
  let stringMnemonic: string;

  if (typeof mnemonic === "string") {
    stringMnemonic = mnemonic;
  } else {
    stringMnemonic = utf8Decode(mnemonic);
  }

  if (!validateMnemonic(stringMnemonic, wordlist)) {
    throw new Error("Invalid BIP-39 mnemonic");
  }

  const seed = await mnemonicToSeed(stringMnemonic);

  return tweetnacl.sign.keyPair.fromSeed(seed.subarray(0, 32));
}
