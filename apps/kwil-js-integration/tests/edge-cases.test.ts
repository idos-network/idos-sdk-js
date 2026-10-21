import { ActionBody, CallBody } from "@idos-network/kwil-js/action";
import { TxReceipt } from "kwil-js-src/core/tx";

import { createTestSchema, isKwildPrivateOn, kwil, kwilSigner, uuidV4, DataType } from "./setup";

describe("Edge cases", () => {
  const namespace = "edge_cases";

  beforeAll(async () => {
    await createTestSchema(namespace, kwil, kwilSigner);
  }, 20000);

  afterAll(async () => {
    await kwil.execSql(`DROP NAMESPACE ${namespace};`, {}, kwilSigner, true);
  }, 20000);

  describe("Executing Actions and calling views when default role does not have SELECT permission", () => {
    beforeAll(async () => {
      await kwil.execSql("REVOKE SELECT FROM default;", {}, kwilSigner, true);
    }, 20000);
    const id = uuidV4();

    afterAll(async () => {
      await kwil.execSql("GRANT SELECT TO default;", {}, kwilSigner, true);
    }, 20000);

    it("should execute an action with positional params", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_post",
        inputs: [[id, "TestUser", "Action Test", "Testing action execution"]],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it("should call a view with positional params", async () => {
      const callBody: CallBody = {
        namespace,
        name: "get_post_by_id",
        inputs: [id],
      };

      const result = await kwil.call(callBody, kwilSigner);
      expect(result.data).toMatchObject({
        result: [
          {
            post_title: "Action Test",
            post_body: "Testing action execution",
          },
        ],
      });
    }, 10000);

    it("should execute when an action has no params", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_post_no_param",
        inputs: [],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it("should call when a view has no params", async () => {
      const callBody: CallBody = {
        namespace,
        name: "read_posts_count",
        inputs: [],
      };

      const result = await kwil.call(callBody, kwilSigner);
      expect(result.data).toMatchObject({
        result: [{ count: "2" }],
      });
    }, 10000);

    it("should fail execute with named params", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_post",
        inputs: [
          { $id: id, $user: "TestUser", $title: "Action Test", $body: "Testing action execution" },
        ],
      };

      await expect(kwil.execute(actionBody, kwilSigner, true)).rejects.toThrow();
    }, 10000);

    (isKwildPrivateOn ? it.skip : it)(
      "should fail call with named params",
      async () => {
        const callBody: CallBody = {
          namespace,
          name: "get_post_by_id",
          inputs: { $id: id },
        };

        await expect(kwil.call(callBody, kwilSigner)).rejects.toThrow();
      },
      10000,
    );
  });

  describe("Asserting types in action inputs", () => {
    beforeAll(async () => {
      await kwil.execSql(
        `{${namespace}}CREATE TABLE asserter (id text PRIMARY KEY);
{${namespace}}CREATE ACTION insert_assert($id text) PUBLIC { INSERT INTO asserter (id) VALUES ($id);};
{${namespace}}CREATE ACTION view_assert($id text) PUBLIC VIEW returns table(id text) { return SELECT * FROM asserter WHERE id = $id;};
`,
        {},
        kwilSigner,
        true,
      );
    }, 20000);

    afterAll(async () => {
      await kwil.execSql(
        `{${namespace}}DROP TABLE asserter;
{${namespace}}DROP ACTION insert_assert;
{${namespace}}DROP ACTION view_assert;`,
        {},
        kwilSigner,
        true,
      );
    }, 20000);

    const id1 = uuidV4();

    it("should execute an action with named params and named asserted types", async () => {
      const body: ActionBody = {
        namespace,
        name: "insert_assert",
        inputs: [{ $id: id1 }],
        types: { $id: DataType.Text },
      };

      const result = await kwil.execute(body, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it("should execute an action with named params and positional types", async () => {
      const body: ActionBody = {
        namespace,
        name: "insert_assert",
        inputs: [{ $id: uuidV4() }],
        types: [DataType.Text],
      };

      const result = await kwil.execute(body, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it("should execute an action with positional params and named asserted types", async () => {
      // kwil-js will assume the order on the named types matches the order on the positional params
      const body: ActionBody = {
        namespace,
        name: "insert_assert",
        inputs: [[uuidV4()]],
        types: { $id: DataType.Text },
      };

      const result = await kwil.execute(body, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it("should execute an action with positional params and positional types", async () => {
      const body: ActionBody = {
        namespace,
        name: "insert_assert",
        inputs: [[uuidV4()]],
        types: [DataType.Text],
      };

      const result = await kwil.execute(body, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it("should call an action with named params and named asserted types", async () => {
      const body: CallBody = {
        namespace,
        name: "view_assert",
        inputs: { $id: id1 },
        types: { $id: DataType.Text },
      };

      const result = await kwil.call(body, kwilSigner);
      expect(result.data).toMatchObject({
        result: [{ id: id1 }],
      });
    }, 10000);

    it("should call an action with named params and positional types", async () => {
      const body: CallBody = {
        namespace,
        name: "view_assert",
        inputs: { $id: id1 },
        types: [DataType.Text],
      };

      const result = await kwil.call(body, kwilSigner);
      expect(result.data).toMatchObject({
        result: [{ id: id1 }],
      });
    }, 10000);

    it("should call an action with positional params and named asserted types", async () => {
      const body: CallBody = {
        namespace,
        name: "view_assert",
        inputs: [id1],
        types: { $id: DataType.Text },
      };

      const result = await kwil.call(body, kwilSigner);
      expect(result.data).toMatchObject({
        result: [{ id: id1 }],
      });
    }, 10000);

    it("should call an action with positional params and positional types", async () => {
      const body: CallBody = {
        namespace,
        name: "view_assert",
        inputs: [id1],
        types: [DataType.Text],
      };

      const result = await kwil.call(body, kwilSigner);
      expect(result.data).toMatchObject({
        result: [{ id: id1 }],
      });
    }, 10000);
  });
});

// describe.skip('Testing case sensitivity on test_db', () => {
//   it('placeholder test until tests are updated', () => {
//     expect(true).toBe(true);
//   });
//   let dbid: string;
//   beforeAll(async () => {
//     const res = await kwil.listDatabases(kwilSigner.identifier);
//     const dbList = res.data;
//     if (!dbList) {
//       await deployTempSchema(schema, kwilSigner);
//       return;
//     }
//     for (const db of dbList) {
//       if (db.name.startsWith('test_db_')) {
//         dbid = db.dbid;
//         return;
//       }
//     }
//     await deployTempSchema(schema, kwilSigner);
//     dbid = kwil.getDBID(kwilSigner.identifier, `test_db_${dbList.length + 1}`);
//   }, 10000);
//   afterAll(async () => {
//     const body: DropBody = {
//       dbid,
//     };
//     await kwil.drop(body, kwilSigner, true);
//   }, 10000);
//   async function buildActionInput(): Promise<ActionInput> {
//     return {
//       $username: 'Luke',
//       $age: 25,
//     };
//   }
//   it('should execute createUserTest action', async () => {
//     const actionInputs = await buildActionInput();
//     const body: ActionBody = {
//       name: 'createUserTest',
//       dbid,
//       inputs: [actionInputs],
//     };
//     const result = await kwil.execute(body, kwilSigner, true);
//     expect(result.data).toBeDefined();
//     expect(result.data).toMatchObject<TxReceipt>({
//       tx_hash: expect.any(String),
//     });
//   }, 10000);
//   it('should execute delete_user action', async () => {
//     const body: ActionBody = {
//       name: 'delete_user',
//       dbid,
//     };
//     const result = await kwil.execute(body, kwilSigner, true);
//     expect(result.data).toBeDefined();
//     expect(result.data).toMatchObject<TxReceipt>({
//       tx_hash: expect.any(String),
//     });
//   }, 10000);
//   it('should execute CREATEUSERTEST action', async () => {
//     const actionInputs = await buildActionInput();
//     const body: ActionBody = {
//       name: 'CREATEUSERTEST',
//       dbid,
//       inputs: [actionInputs],
//     };
//     const result = await kwil.execute(body, kwilSigner, true);
//     expect(result.data).toBeDefined();
//     expect(result.data).toMatchObject<TxReceipt>({
//       tx_hash: expect.any(String),
//     });
//   }, 10000);
//   it('should execute DELETE_USER action', async () => {
//     const body: ActionBody = {
//       name: 'DELETE_USER',
//       dbid,
//     };
//     const result = await kwil.execute(body, kwilSigner, true);
//     expect(result.data).toBeDefined();
//     expect(result.data).toMatchObject<TxReceipt>({
//       tx_hash: expect.any(String),
//     });
//   }, 10000);
//   it('should execute createusertest action', async () => {
//     const actionInputs = await buildActionInput();
//     const body: ActionBody = {
//       name: 'createusertest',
//       dbid,
//       inputs: [actionInputs],
//     };
//     const result = await kwil.execute(body, kwilSigner, true);
//     expect(result.data).toBeDefined();
//     expect(result.data).toMatchObject<TxReceipt>({
//       tx_hash: expect.any(String),
//     });
//   }, 10000);
// });
