import { Wallet } from "ethers";
import nacl from "tweetnacl";
import { describe, expect, test } from "vitest";

import { KwilSigner } from "../core/kwilSigner";
import { SignatureType } from "../core/signature";

describe("KwilSigner Unit Tests", () => {
  test("KwilSigner with constructor using EthSigner should return a KwilSigner class", async () => {
    const ethSigner = Wallet.createRandom();
    const walletAddress = ethSigner.address;

    const kSigner = new KwilSigner(ethSigner, walletAddress);

    expect(kSigner).toBeDefined();
    expect(kSigner.identifier).toBeInstanceOf(Uint8Array);
    expect(kSigner.signer).toBe(ethSigner);
    expect(kSigner.signatureType).toBe("secp256k1_ep");
    expect(kSigner).toBeInstanceOf(KwilSigner);
  });

  test("KwilSigner with constructor using CustomSigner should return a KwilSigner class", () => {
    const keyPair = nacl.sign.keyPair();
    const customSigner = async (message: Uint8Array) =>
      nacl.sign.detached(message, keyPair.secretKey);

    const kSigner = new KwilSigner(customSigner, keyPair.publicKey, SignatureType.ED25519);

    expect(kSigner).toBeDefined();
    expect(kSigner.identifier).toBe(keyPair.publicKey);
    expect(kSigner.signer).toBe(customSigner);
    expect(kSigner.signatureType).toBe("ed25519");
    expect(kSigner).toBeInstanceOf(KwilSigner);
  });

  test("KwilSigner with constructor using CustomSigner and no signature type should throw an error", () => {
    const keyPair = nacl.sign.keyPair();
    const customSigner = async (message: Uint8Array) =>
      nacl.sign.detached(message, keyPair.secretKey);

    expect(() => {
      // @ts-ignore
      new KwilSigner(customSigner, keyPair.publicKey);
    }).toThrow(
      "Could not determine signature type from signer. Please pass a signature type to the KwilSigner constructor.",
    );
  });
});
