import { Utils, WebKwil } from "@kwilteam/kwil-js";
import { Wallet } from "ethers";
import { implicitAddressFromPublicKey } from "src/lib";
import { KwilWrapper } from "src/lib/kwil-wrapper";
import { beforeEach, describe, expect, test } from "vitest";
import { TestKwilClient, kwilProvider } from "./test-kwil-client";

let kwilWrapper: KwilWrapper;

describe("kwil-wrapper", () => {
  beforeEach(() => {
    kwilWrapper = new KwilWrapper(new TestKwilClient(), kwilProvider);
  });

  test("should create a new instance of KwilWrapper", () => {
    expect(kwilWrapper.client).toBeInstanceOf(WebKwil);
    expect(kwilWrapper.kwilProvider).toBe(kwilProvider);
  });

  test("should set a `secp256k1_ep` signer", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: using any to avoid type errors for now.
    const signer: any = Wallet.createRandom();

    await kwilWrapper.setSigner({
      accountId: signer.address,
      signer,
      signatureType: "secp256k1_ep",
    });

    expect(kwilWrapper.signer?.signatureType).toBe("secp256k1_ep");
  });

  test("should set a `nep413` signer", async () => {
    const signer = () => Promise.resolve(new Uint8Array());
    const pk = "ed25519:ACWH3UoS3JVnVhmvHMghKN9K76HqiYQpwodJbJCUtciY";
    const accountId = implicitAddressFromPublicKey(pk);
    await kwilWrapper.setSigner({
      accountId,
      signer,
      signatureType: "nep413",
    });

    expect(kwilWrapper.signer?.signatureType).toBe("nep413");
  });

  test("should build a proper action payload with empty inputs and no description", async () => {
    const payload = await kwilWrapper.buildExecAction("do something", null);

    expect(payload).toEqual({
      name: "do something",
      namespace: "main",
      inputs: [],
    });
  });

  test("should build a proper action payload with all values passed", async () => {
    const inputs = [{ recipient_encryption_public_key: "value_2", id: "value_1" }];
    const payload = await kwilWrapper.buildExecAction(
      "add_user_as_inserter",
      inputs,
      "some description",
    );

    expect(payload).toEqual({
      name: "add_user_as_inserter",
      namespace: "main",
      description: "*some description*",
      inputs: [["value_1", "value_2"]],
    });
  });
});
