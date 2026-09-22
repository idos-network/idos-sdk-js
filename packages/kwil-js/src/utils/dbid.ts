import { concatBytes } from "./bytes";
import { sha224BytesToString } from "./crypto";
import { hexToBytes, stringToBytes } from "./serial";

export function generateDBID(owner: string | Uint8Array, name: string): string {
  if (typeof owner === "string") {
    owner = hexToBytes(owner);
  }

  return "x" + sha224BytesToString(concatBytes(stringToBytes(name.toLowerCase()), owner));
}
