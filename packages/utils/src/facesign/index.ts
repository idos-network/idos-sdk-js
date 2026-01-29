import tweetnacl from "tweetnacl";
import { mnemonicToSeed } from "web-bip39";
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

  const seed = await mnemonicToSeed(stringMnemonic);

  return tweetnacl.sign.keyPair.fromSeed(seed.subarray(0, 32));
}
