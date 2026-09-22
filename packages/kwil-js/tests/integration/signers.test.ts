import nacl from "tweetnacl";

import { ActionBody } from "../../src/core/action";
import { Account } from "../../src/core/network";
import { GenericResponse } from "../../src/core/resreq";
import { TxReceipt } from "../../src/core/tx";
import { KwilSigner, Types, Utils } from "../../src/index";
import { bytesToHex } from "../../src/utils/serial";
import { deriveKeyPair64, grantAdminAccess, kwil } from "./setup";
import { createTestSchema, dropTestSchema } from "./setup";

describe("Testing custom signers", () => {
  let edSigner: KwilSigner;
  let input: Types.ActionInput;
  const namespace = "signers_test";

  async function getEdKeys(): Promise<nacl.SignKeyPair> {
    return await deriveKeyPair64("69420", "69420");
  }

  async function customEdSigner(msg: Uint8Array): Promise<Uint8Array> {
    const edKeys = await getEdKeys();
    return nacl.sign.detached(msg, edKeys.secretKey);
  }

  beforeAll(async () => {
    const edKeys = await getEdKeys();
    edSigner = new KwilSigner(customEdSigner, edKeys.publicKey, "ed25519");

    await grantAdminAccess(bytesToHex(edSigner.identifier));
    await createTestSchema(namespace, kwil, edSigner);
  }, 20000);

  afterAll(async () => {
    await dropTestSchema(namespace, kwil, edSigner);
  }, 20000);

  beforeEach(async () => {
    input = new Utils.ActionInput();
    input.put("$id", "3515e7c2-3333-4a75-bbba-91c4e6691a65");
    input.put("$user", "Luke");
    input.put("$title", "Test Post");
    input.put("$body", "This is a test post");
  });

  it("should broadcast ed25519 signed tx's correctly", async () => {
    const body: ActionBody = {
      namespace,
      name: "add_post",
      inputs: [input],
    };

    const result = await kwil.execute(body, edSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 20000);

  // it('should call ed25519 signed msgs correctly', async () => {
  //   const payload: CallBodyNode = {
  //     namespace,
  //     name: 'view_must_sign',
  //   };

  //   const result = await kwil.call(payload, edSigner);

  //   expect(result.data).toBeDefined();
  //   expect(result.data).toMatchObject<MsgReceipt>({
  //     result: expect.any(Array),
  //   });
  // });

  it("should get account for an ed25519 account", async () => {
    const acct = await kwil.getAccount(edSigner.identifier);

    expect(acct).toBeDefined();
    expect(acct).toMatchObject<GenericResponse<Account>>({
      data: {
        balance: expect.any(String),
        nonce: expect.any(Number),
        id: {
          identifier: expect.any(String),
          key_type: expect.any(String),
        },
      },
      status: 200,
    });
  });
});
