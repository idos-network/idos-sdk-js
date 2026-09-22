import { BytesLike, RlpStructuredData, decodeRlp, toUtf8String } from "ethers";
import util from "util";

import { rlpArray } from "./array";

function decode() {
  const hex = BytesToHex(rlpArray as unknown as Uint8Array);
  const decoded = decodeRlp("0x" + hex);
  // return decoded
  return decodeElement(decoded);
}

function BytesToHex(bytes: Uint8Array): string {
  return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

function decodeElement(element: RlpStructuredData): any {
  if (Array.isArray(element)) {
    return element.map((e) => decodeElement(e));
  } else if (typeof element === "string") {
    if (element.startsWith("0x")) {
      // Attempt to decode as a string first
      try {
        return toUtf8String(element);
      } catch (error) {
        // If it fails, try decoding as a number
        try {
          return element.toString();
        } catch (e) {
          return element; // Keep it as a hex string if all fails
        }
      }
    } else {
      return element;
    }
  } else {
    return element;
  }
}

console.log(util.inspect(decode(), { depth: null, maxArrayLength: null }));
