import { encode } from "@stablelib/base64";

// form Uint8Array to Base64 string
export const fromUintToString = (dataArr) => {
  return encode(dataArr);
};

// Reverse operation to convert Base64 string back to Uint8Array
export const base64ToUint8Array = (base64Str) => {
  const binaryStr = atob(base64Str); // Decode Base64 string to binary string
  const len = binaryStr.length;
  const uintArray = new Uint8Array(len); // Create a Uint8Array of the same length

  for (let i = 0; i < len; i++) {
    uintArray[i] = binaryStr.charCodeAt(i); // Convert each character back to the byte values
  }

  return uintArray;
};
