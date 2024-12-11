import { Wallet } from "ethers";
import { Auth, NoProfile } from "src/lib/auth";
import { KwilWrapper } from "src/lib/kwil-wrapper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Store } from "../../../idos-store";
import { TestKwilClient } from "./test-kwil-client";

let auth: Auth;
const humanId = "human-id";
const currentUserPublicKey = "<PUBLIC_KEY>";

describe("auth", () => {
  beforeEach(() => {
    auth = new Auth(new KwilWrapper(new TestKwilClient()), new Store());

    auth.kwilWrapper.getHumanProfile = vi.fn().mockResolvedValue({
      current_user_enc_public_key: currentUserPublicKey,
      id: humanId,
    });
    auth.kwilWrapper.client.auth.logout = vi.fn().mockResolvedValue(void 0);
    auth.kwilWrapper.hasProfile = vi.fn().mockResolvedValue(true);
  });

  test("should create a new instance of Auth", () => {
    expect(auth.kwilWrapper).toBeInstanceOf(KwilWrapper);
    expect(auth.store).toBeInstanceOf(Store);
  });

  test("should throw an error when currentUser is called without setting a signer", () => {
    expect(() => auth.currentUser).toThrowError("Call idOS.setSigner first.");
  });

  test("should set a user from an EVM signer", async () => {
    const signer = Wallet.createRandom();
    const address = await signer.getAddress();

    await auth.setEvmSigner(signer);

    expect(auth.currentUser).toEqual({
      humanId,
      currentUserPublicKey,
      address,
    });
  });

  describe("with an unknown user", () => {
    test("should raise NoProfile", async () => {
      auth.kwilWrapper.hasProfile = vi.fn().mockResolvedValueOnce(false);

      const signer = Wallet.createRandom();

      expect(() => auth.setEvmSigner(signer)).rejects.toThrowError(NoProfile);
    });
  });
});
