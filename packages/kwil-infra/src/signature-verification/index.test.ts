import { describe, expect, it, vi } from "vitest";

vi.mock("./evm", () => ({ verifyEvmSignature: vi.fn() }));
vi.mock("./stellar", () => ({ verifyStellarSignature: vi.fn() }));
vi.mock("../near/signature-verification", () => ({ verifyNearSignature: vi.fn() }));
vi.mock("../xrp/signature-verification", () => ({ verifyRippleSignature: vi.fn() }));

import { verifyNearSignature } from "../near/signature-verification.js";
import { verifyRippleSignature } from "../xrp/signature-verification.js";
import { verifyEvmSignature } from "./evm.js";
import { verifySignature } from "./index.js";
import { verifyStellarSignature } from "./stellar.js";

describe("verifySignature", () => {
  it("routes EVM verification", async () => {
    const evmMock = vi.mocked(verifyEvmSignature);
    evmMock.mockResolvedValueOnce(true);

    const result = await verifySignature({
      address: "0xabc",
      signature: "0xsig",
      message: "hello",
      wallet_type: "EVM",
      public_key: [],
    });

    expect(result).toBe(true);
    expect(evmMock).toHaveBeenCalledWith("hello", "0xsig", "0xabc");
  });

  it("requires public_key for non-EVM wallets", async () => {
    await expect(
      verifySignature({
        address: "alice.near",
        signature: "sig",
        message: "hello",
        wallet_type: "NEAR",
        public_key: [],
      }),
    ).rejects.toThrow("Wallet public_key is required for non-EVM wallets");
  });

  it("routes NEAR verification", async () => {
    const nearMock = vi.mocked(verifyNearSignature);
    nearMock.mockResolvedValueOnce(true);

    const result = await verifySignature({
      address: "alice.near",
      signature: "sig",
      message: "hello",
      wallet_type: "NEAR",
      public_key: ["ed25519:abc"],
    });

    expect(result).toBe(true);
    expect(nearMock).toHaveBeenCalledWith("hello", "sig", "ed25519:abc");
  });

  it("routes Stellar verification", async () => {
    const stellarMock = vi.mocked(verifyStellarSignature);
    stellarMock.mockResolvedValueOnce(true);

    const result = await verifySignature({
      address: "GABC",
      signature: "sig",
      message: "hello",
      wallet_type: "stellar",
      public_key: ["GABC"],
    });

    expect(result).toBe(true);
    expect(stellarMock).toHaveBeenCalledWith("hello", "sig", "GABC");
  });

  it("returns false when verifier throws", async () => {
    const xrpMock = vi.mocked(verifyRippleSignature);
    xrpMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const result = await verifySignature({
      address: "rAddress",
      signature: "sig",
      message: "hello",
      wallet_type: "XRPL",
      public_key: ["pk"],
    });

    expect(result).toBe(false);
  });
});
