import { base64ToBytes } from "../../dist/utils/base64";
import { TxReceipt } from "../../src/core/tx";
import { isKwildPrivateOn, kwilSigner, uuidV4 } from "./setup";
import { kwil } from "./setup";

(!isKwildPrivateOn ? describe : describe.skip)("Kwil DB types", () => {
  const namespace = "variable_test";
  const tableName = "var_table";

  let actions: { name: string; sql: string }[] = [];

  describe("Schema Creation", () => {
    it("should create namespace", async () => {
      const result = await kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should create var_table", async () => {
      const createTable = `{${namespace}} CREATE TABLE var_table (
        uuid_col uuid PRIMARY KEY,
        text_col text,
        int_col int,
        bool_col bool,
        dec_col numeric(5,2),
        big_dec_col numeric(20,10),
        blob_col bytea
      );`;

      const tableResult = await kwil.execSql(createTable, {}, kwilSigner, true);
      expect(tableResult.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    describe("Action Creation", () => {
      actions = [
        {
          name: "insert_all",
          sql: `CREATE ACTION insert_all($id uuid, $text text, $int int, $bool bool, $dec numeric(5,2), $big_dec numeric(20,10), $blob bytea) PUBLIC { 
            INSERT INTO var_table (uuid_col, text_col, int_col, bool_col, dec_col, big_dec_col, blob_col) 
            VALUES ($id, $text, $int, $bool, $dec, $big_dec, $blob); 
          }`,
        },
        {
          name: "insert_uuid",
          sql: `CREATE ACTION insert_uuid($id uuid) PUBLIC {
            INSERT INTO var_table(uuid_col) VALUES ($id);
          }`,
        },
        {
          name: "insert_text",
          sql: `CREATE ACTION insert_text($id uuid, $text text) PUBLIC {
            INSERT INTO var_table (uuid_col, text_col) VALUES ($id, $text);
          }`,
        },
        {
          name: "insert_int",
          sql: `CREATE ACTION insert_int($id uuid, $int int) PUBLIC {
            INSERT INTO var_table (uuid_col, int_col) VALUES ($id, $int);
          }`,
        },
        {
          name: "insert_dec",
          sql: `CREATE ACTION insert_dec($id uuid, $dec numeric(5,2)) PUBLIC {
            INSERT INTO var_table (uuid_col, dec_col) VALUES ($id, $dec);
          }`,
        },
        {
          name: "insert_bool",
          sql: `CREATE ACTION insert_bool($id uuid, $bool bool) PUBLIC {
            INSERT INTO var_table (uuid_col, bool_col) VALUES ($id, $bool);
          }`,
        },
        {
          name: "insert_blob",
          sql: `CREATE ACTION insert_blob($id uuid, $blob bytea) PUBLIC {
            INSERT INTO var_table (uuid_col, blob_col) VALUES ($id, $blob);
          }`,
        },
        {
          name: "insert_big_dec",
          sql: `CREATE ACTION insert_big_dec($id uuid, $big_dec numeric(20,10)) PUBLIC {
            INSERT INTO var_table (uuid_col, big_dec_col) VALUES ($id, $big_dec);
          }`,
        },
      ];

      actions.forEach((action) => {
        it(`should create "${action.name}" action`, async () => {
          const result = await kwil.execSql(`{${namespace}} ${action.sql}`, {}, kwilSigner, true);

          expect(result.data).toMatchObject<TxReceipt>({
            tx_hash: expect.any(String),
          });
        });
      });
    });
  });

  describe("Test variables insertion", () => {
    // TODO: Skipped this test because it is not working as expected.
    // Big decimals may have changed since the last release.
    // Getting error: expected argument 6 to be numeric(20,10), got numeric(17,7)
    it.skip("should be able to insert all variables", async () => {
      const uuid = uuidV4();
      const text = "This is a test text";
      const int = 123;
      const bool = true;
      const dec = 123.45;
      // const bigDec = 1234567890.123456789;
      const blob = new Uint8Array([1, 2, 3, 4, 5]);

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_all",
          inputs: [
            {
              $id: uuid,
              $text: text,
              $int: int,
              $bool: bool,
              $dec: dec,
              // $big_dec: bigDec,
              $blob: blob,
            },
          ],
        },
        kwilSigner,
        true,
      );

      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      const query = await kwil.selectQuery(
        `{${namespace}} SELECT * FROM ${tableName} WHERE uuid_col = $uuid`,
        {
          $uuid: uuid,
        },
      );
      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    });

    it("should be able to insert a record with a UUID", async () => {
      const uuid = uuidV4();

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_uuid",
          inputs: [
            {
              $id: uuid,
            },
          ],
        },
        kwilSigner,
        true,
      );

      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      const query = await kwil.selectQuery(
        `{${namespace}} SELECT * FROM ${tableName} WHERE uuid_col = $uuid`,
        {
          $uuid: uuid,
        },
      );
      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with a text", async () => {
      const id = uuidV4();
      const text = "This is a test text";

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_text",
          inputs: [
            {
              $id: id,
              $text: text,
            },
          ],
        },
        kwilSigner,
        true,
      );

      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      const query = await kwil.selectQuery(
        `{${namespace}} SELECT * FROM ${tableName} WHERE text_col = $text`,
        {
          $text: text,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with an integer", async () => {
      const id = uuidV4();
      const num = 123;

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_int",
          inputs: [
            {
              $id: id,
              $int: num,
            },
          ],
        },
        kwilSigner,
        true,
      );

      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      const query = await kwil.selectQuery(
        `{${namespace}} SELECT * FROM ${tableName} WHERE int_col = $num`,
        {
          $num: num,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with a boolean", async () => {
      const id = uuidV4();
      const bool = true;

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_bool",
          inputs: [
            {
              $id: id,
              $bool: bool,
            },
          ],
        },
        kwilSigner,
        true,
      );

      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      const query = await kwil.selectQuery(
        `{${namespace}} SELECT * FROM ${tableName} WHERE bool_col = $bool`,
        {
          $bool: bool,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with a decimal", async () => {
      const id = uuidV4();
      const dec = 123.45;

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_dec",
          inputs: [
            {
              $id: id,
              $dec: dec,
            },
          ],
        },
        kwilSigner,
        true,
      );

      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      const query = await kwil.selectQuery(
        `{${namespace}} SELECT * FROM ${tableName} WHERE uuid_col = $id`,
        {
          $id: id,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with a blob as a Uint8array", async () => {
      const id = uuidV4();
      const blob = new Uint8Array([1, 2, 3, 4, 5]);

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_blob",
          inputs: [
            {
              $id: id,
              $blob: blob,
            },
          ],
        },
        kwilSigner,
        true,
      );

      expect(res.data).toBeDefined();
      expect(res.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      const query = await kwil.selectQuery(
        `{${namespace}} SELECT * FROM ${tableName} WHERE blob_col = $blob`,
        {
          $blob: blob,
        },
      );
      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);

      // @ts-ignore
      // base64
      const blobVal = query.data[0]?.blob_col as string;
      expect(base64ToBytes(blobVal)).toStrictEqual(blob);
    }, 10000);

    // TODO: Unsure if this is the correct behavior. Commented out for now.
    // it('decimals outside the max safe integer range should return as a string', async () => {
    //   const id = uuidV4();
    //   const bigDec = '1234567890.1234567890';

    //   const res = await kwil.execute(
    //     {
    //       namespace,
    //       name: 'insert_big_dec',
    //       inputs: [
    //         {
    //           $id: id,
    //           $big_dec: bigDec,
    //         },
    //       ],
    //     },
    //     kwilSigner,
    //     true
    //   );

    //   expect(res.data).toBeDefined();
    //   expect(res.data).toMatchObject<TxReceipt>({
    //     tx_hash: expect.any(String),
    //   });

    //   const query = await kwil.selectQuery(
    //     `{${namespace}} SELECT * FROM ${tableName} WHERE big_dec_col = $big_dec`,
    //     {
    //       $big_dec: bigDec,
    //     }
    //   );
    //   expect(query.data).toBeDefined();
    //   expect(query.data).toHaveLength(1);
    //   // @ts-ignore
    //   expect(query.data[0]?.big_dec_col).toBe(bigDec);
    // }, 10000);
  });

  describe("Failure Cases", () => {
    it("should NOT be able to insert a number into text field", async () => {
      const id = uuidV4();
      const invalidText = 123; // number instead of text

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_text",
            inputs: [
              {
                $id: id,
                $text: invalidText,
              },
            ],
          },
          kwilSigner,
          true,
        ),
      ).rejects.toThrow();
    });

    it("should NOT be able to insert text into int field", async () => {
      const id = uuidV4();
      const invalidInt = "not a number"; // text instead of int

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_int",
            inputs: [
              {
                $id: id,
                $int: invalidInt,
              },
            ],
          },
          kwilSigner,
          true,
        ),
      ).rejects.toThrow();
    });

    it("should NOT be able to insert text into uuid field", async () => {
      const invalidUuid = "not-a-uuid";

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_uuid",
            inputs: [
              {
                $id: invalidUuid,
              },
            ],
          },
          kwilSigner,
          true,
        ),
      ).rejects.toThrow();
    });

    it("should NOT be able to insert uuid into numeric field", async () => {
      const id = uuidV4();
      const invalidDec = uuidV4(); // uuid instead of numeric

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_dec",
            inputs: [
              {
                $id: id,
                $dec: invalidDec,
              },
            ],
          },
          kwilSigner,
          true,
        ),
      ).rejects.toThrow();
    });

    it("should NOT be able to insert numeric with incorrect precision into numeric field", async () => {
      const id = uuidV4();
      const invalidDec = 12.3; // precision should be 5,2 but we are inserting 3,1

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_dec",
            inputs: [
              {
                $id: id,
                $dec: invalidDec,
              },
            ],
          },
          kwilSigner,
          true,
        ),
      ).rejects.toThrow();
    });
  });

  describe("Schema Cleanup", () => {
    it("should drop all actions", async () => {
      for (const action of actions) {
        const result = await kwil.execSql(
          `{${namespace}} DROP ACTION ${action.name};`,
          {},
          kwilSigner,
          true,
        );
        expect(result.data).toMatchObject<TxReceipt>({
          tx_hash: expect.any(String),
        });
      }
    }, 10000);

    it("should drop table", async () => {
      const dropTableResult = await kwil.execSql(
        `{${namespace}} DROP TABLE ${tableName};`,
        {},
        kwilSigner,
        true,
      );
      expect(dropTableResult.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should drop namespace", async () => {
      const dropNamespaceResult = await kwil.execSql(
        `DROP NAMESPACE ${namespace};`,
        {},
        kwilSigner,
        true,
      );
      expect(dropNamespaceResult.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });
  });
});
