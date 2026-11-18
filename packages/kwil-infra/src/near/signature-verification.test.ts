import { hexEncode, utf8Encode } from "@idos-network/utils/codecs";
import { KeyPair } from "near-api-js";
import { describe, expect, it } from "vitest";

import { kwilNep413Signer } from "./nep413";
import { verifyNearSignature } from "./signature-verification";

async function sign(message: string, recipient: string) {
  const keyPair = KeyPair.fromRandom("ed25519");
  const signed = await kwilNep413Signer(recipient)(keyPair)(utf8Encode(message));
  return {
    signature: hexEncode(signed),
    publicKey: keyPair.getPublicKey().toString(),
  };
}

describe("verifyNearSignature", () => {
  it("accepts a signature addressed to idos.network", async () => {
    const { signature, publicKey } = await sign("hello", "idos.network");
    expect(await verifyNearSignature("hello", signature, publicKey)).toBe(true);
  });

  it.each(["evil.example", "idos.network.evil", "idos-issuer"])(
    "rejects a valid signature addressed to %s",
    async (recipient) => {
      const { signature, publicKey } = await sign("hello", recipient);
      expect(await verifyNearSignature("hello", signature, publicKey)).toBe(false);
    },
  );

  it("rejects an idos.network signature of a different message", async () => {
    const { signature, publicKey } = await sign("hello", "idos.network");
    expect(await verifyNearSignature("goodbye", signature, publicKey)).toBe(false);
  });
});
