import { ActionBody } from "../../src/core/action";
import { createTestSchema, dropTestSchema, kwil, kwilSigner, address, uuidV4 } from "./setup";

// TODO: Needs more tests and testing.  Seems the createTestSchema & dropTestSchema is not working as expected. Namespace is not being dropped.
describe.skip("unconfirmedNonce", () => {
  const namespace = "nonce_test";

  beforeAll(async () => {
    await createTestSchema(namespace, kwil, kwilSigner);
  }, 10000);

  afterAll(async () => {
    await dropTestSchema(namespace, kwil, kwilSigner);
  }, 10000);

  it("should return a nonce that is 1 greater than the current nonce immediately after a transaction", async () => {
    const actionBody: ActionBody = {
      namespace,
      name: "add_post",
      inputs: [
        {
          $id: uuidV4(),
          $user: "Luke",
          $title: "Test Post",
          $body: "This is a test post",
        },
      ],
      description: "This is a test action",
    };
    const initAccount = await kwil.getAccount(address);
    const initialNonce = Number(initAccount.data?.nonce);
    await kwil.execute(actionBody, kwilSigner);
    const account = await kwil.getAccount(address);
    const nonce = Number(account.data?.nonce);
    expect(nonce).toBe(initialNonce + 1);
  });

  it("should error if nonce is incorrect", async () => {
    const acct = await kwil.getAccount(address);
    const nonce = Number(acct.data?.nonce);
    if (!nonce) throw new Error("No nonce found");
    const actionBody: ActionBody = {
      namespace,
      name: "add_post",
      inputs: [
        {
          $user: "Luke",
          $title: "Test Post",
          $body: "This is a test post",
        },
      ],
      description: "This is a test action",
      nonce: nonce - 1,
    };

    await expect(kwil.execute(actionBody, kwilSigner)).rejects.toThrow();
  });
});
