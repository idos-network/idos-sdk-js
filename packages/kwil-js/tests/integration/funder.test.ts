import { TransferBody } from "../../src/funder/funding_types";
import { bytesToHex } from "../../src/utils/serial";
import { kwil, isGasOn, kwilSigner, deriveKeyPair64 } from "./setup";

// testing balance transfer / management
(isGasOn ? describe : describe.skip)("Funder", () => {
  it("should transfer funds to Eth Accounts", async () => {
    const transferBody: TransferBody = {
      to: "0x6E2fA2aF9B4eF5c8A3BcF9A9B9A4F1a1a2c1c1c1",
      amount: BigInt(1),
    };

    const result = await kwil.funder.transfer(transferBody, kwilSigner, true);

    expect(result.data).toMatchObject({
      tx_hash: expect.any(String),
    });
  });

  it("should transfer funds to ED25119 accounts", async () => {
    const edKeys = await deriveKeyPair64("69420", "69420");
    const edPk = bytesToHex(edKeys.publicKey);

    const transferBody: TransferBody = {
      to: edPk,
      amount: BigInt(1),
    };

    const result = await kwil.funder.transfer(transferBody, kwilSigner, true);

    expect(result.data).toMatchObject({
      tx_hash: expect.any(String),
    });
  });

  describe("Error Cases", () => {
    it("should fail when using a custom key type without specification", async () => {
      const transferBody: TransferBody = {
        to: "zzzzz",
        amount: BigInt(1),
      };

      await expect(kwil.funder.transfer(transferBody, kwilSigner, true)).rejects.toThrow();
    });
  });
});
