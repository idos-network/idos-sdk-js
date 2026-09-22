import { AccountKeyType } from "../core/enums";
import { hexToBytes, bytesToHex } from "./serial";

export function inferKeyType(owner: string | Uint8Array): AccountKeyType {
  if (typeof owner === "string") {
    owner = hexToBytes(owner);
  }

  if (owner.length === 32 || isXrplKey(owner) || isStellarAddress(owner)) {
    return AccountKeyType.ED25519;
  }

  if (owner.length === 20) {
    return AccountKeyType.SECP256K1;
  }

  throw new Error("Cannot determine key type from owner.");
}

function isXrplKey(key: Uint8Array): boolean {
  return key.length === 33 && bytesToHex(key).slice(0, 2) === "ed";
}

function isStellarAddress(addr: Uint8Array): boolean {
  const address = new TextDecoder("utf-8").decode(new Uint8Array(addr));

  return /^G[A-Z0-9]{55}$/.test(address);
}
