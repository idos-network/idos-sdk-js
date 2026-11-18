import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import { createServerKwilSigner } from "./create-kwil-signer";

describe("createServerKwilSigner with Nacl sign key pair", () => {
  it("emits lowercase hex SignerAddress matching kwild ed25519 @caller format", async () => {
    const keyPair = nacl.sign.keyPair();
    const [kwilSigner, signerAddress] = await createServerKwilSigner(keyPair);

    expect(signerAddress).toMatch(/^[0-9a-f]{64}$/);
    expect(signerAddress).toBe(signerAddress.toLowerCase());
    expect(kwilSigner).toBeDefined();
  });
});
