import { Utils, WebKwil } from "@kwilteam/kwil-js";
import { Wallet } from "ethers-v6";
import { implicitAddressFromPublicKey } from "src/lib";
import { KwilWrapper } from "src/lib/kwil-wrapper";
import { beforeEach, describe, expect, test } from "vitest";

const kwilProvider = "kwil-provider";
const chainId = "chain-id";
const dbId = "db-id";

// biome-ignore lint/suspicious/noExportsInTest: re-use TestKwilClient class
export class TestKwilClient extends WebKwil {
  constructor() {
    super({ kwilProvider, chainId });
  }
}

let kwilWrapper: KwilWrapper;

describe("kwil-wrapper", () => {
  beforeEach(() => {
    kwilWrapper = new KwilWrapper(new TestKwilClient(), kwilProvider, dbId);
  });

  test("should create a new instance of KwilWrapper", () => {
    expect(kwilWrapper.client).toBeInstanceOf(WebKwil);
    expect(kwilWrapper.kwilProvider).toBe(kwilProvider);
    expect(kwilWrapper.dbId).toBe(dbId);
  });

  test("should set a `secp256k1_ep` signer", async () => {
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
    const payload = await kwilWrapper.buildAction("do something", null);

    expect(payload).toEqual({
      name: "do something",
      dbid: kwilWrapper.dbId,
      inputs: [],
    });
  });

  test("should build a proper action payload with all values passed", async () => {
    const inputs = { key_1: "value_1", key_2: "value_2" };
    const payload = await kwilWrapper.buildAction("do something", [inputs], "some description");
    const actionInput = new Utils.ActionInput();
    actionInput.put("$key_1", "value_1");
    actionInput.put("$key_2", "value_2");

    expect(payload).toEqual({
      name: "do something",
      dbid: kwilWrapper.dbId,
      description: "*some description*",
      inputs: [actionInput],
    });
  });
});
