import { concatBytes } from "./bytes";
import { sha224BytesToString } from "./crypto";
import { hexToBytes, stringToBytes } from "./serial";

export function generateDBID(owner: string | Uint8Array, name: string): string {
  const ownerBytes = typeof owner === "string" ? hexToBytes(owner) : owner;

  return "x" + sha224BytesToString(concatBytes(stringToBytes(name.toLowerCase()), ownerBytes));
}
