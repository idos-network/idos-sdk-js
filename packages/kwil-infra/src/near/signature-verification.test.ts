import { borshSerialize, bs58Encode, hexEncode, sha256Hash } from "@idos-network/utils/codecs";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import { verifyNearSignature } from "./signature-verification";

const schema = {
  struct: {
    tag: "u32",
    message: "string",
    nonce: { array: { type: "u8", len: 32 } },
    recipient: "string",
    callbackUrl: { option: "string" },
  },
};

function sign(message: string, recipient: string) {
  const keyPair = nacl.sign.keyPair();
  const payload = borshSerialize(schema, {
    tag: 2147484061,
    message,
    nonce: Array(32).fill(1),
    recipient,
    callbackUrl: undefined,
  });
  const signature = nacl.sign.detached(sha256Hash(payload), keyPair.secretKey);
  const length = new Uint8Array(2);
  new DataView(length.buffer).setUint16(0, payload.length, false);

  return {
    signature: hexEncode(new Uint8Array([...length, ...payload, ...signature])),
    publicKey: `ed25519:${bs58Encode(keyPair.publicKey)}`,
  };
}

describe("verifyNearSignature", () => {
  it("accepts a signature addressed to idos.network", async () => {
    const { signature, publicKey } = sign("hello", "idos.network");
    expect(await verifyNearSignature("hello", signature, publicKey)).toBe(true);
  });

  it("rejects a valid signature addressed to another recipient", async () => {
    const { signature, publicKey } = sign("hello", "evil.example");
    expect(await verifyNearSignature("hello", signature, publicKey)).toBe(false);
  });
});
