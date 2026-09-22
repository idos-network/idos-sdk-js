import { encodeRlp } from "ethers";

import { kwilEncode } from "../../src/utils/rlp";
import { bytesToHex, hexToBytes, numberToBytes } from "../../src/utils/serial";

const ary1 = [
  0, 1, 248, 80, 184, 61, 0, 1, 248, 57, 170, 48, 120, 65, 102, 70, 68, 67, 48, 54, 99, 70, 51, 52,
  97, 70, 68, 55, 68, 53, 56, 48, 49, 65, 49, 51, 100, 52, 56, 67, 57, 50, 65, 68, 51, 57, 54, 48,
  57, 57, 48, 49, 68, 138, 115, 105, 109, 112, 108, 101, 116, 101, 115, 116, 192, 192, 192, 141,
  100, 101, 112, 108, 111, 121, 95, 115, 99, 104, 101, 109, 97, 128, 1, 128,
];
const ar2 = [
  0, 1, 248, 80, 184, 61, 0, 1, 248, 57, 170, 48, 120, 65, 102, 70, 68, 67, 48, 54, 99, 70, 51, 52,
  97, 70, 68, 55, 68, 53, 56, 48, 49, 65, 49, 51, 100, 52, 56, 67, 57, 50, 65, 68, 51, 57, 54, 48,
  57, 57, 48, 49, 68, 138, 115, 105, 109, 112, 108, 101, 116, 101, 115, 116, 192, 192, 192, 141,
  100, 101, 112, 108, 111, 121, 95, 115, 99, 104, 101, 109, 97, 128, 1, 128,
];

function checkArrEquality(ar1: any[], ar2: any[]): boolean {
  if (ar1.length !== ar2.length) {
    return false;
  }

  for (let i = 0; i < ar1.length; i++) {
    if (ar1[i] !== ar2[i]) {
      return false;
    }
  }

  return true;
}

console.log("EQUAL", checkArrEquality(ary1, ar2));
console.log("expected length: ", ary1.length);
console.log("actual length: ", ar2.length);

console.log(numberToBytes(0));
