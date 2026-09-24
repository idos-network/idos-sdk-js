import { TxReceipt } from "kwil-js-src/core/tx";

import { isKwildPrivateOn, kwilSigner, uuidV4 } from "./setup";
import { kwil } from "./setup";

(!isKwildPrivateOn ? describe : describe.skip)("Kwil DB types", () => {
  const namespace = "array_tests";
  const tableName = "saved_arrays";

  let actions: { name: string; sql: string }[] = [];

  describe("Schema Creation", () => {
    it("should create namespace", async () => {
      const result = await kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should create var_table", async () => {
      const createTable = `{${namespace}} CREATE TABLE saved_arrays (
        uuid_col uuid PRIMARY KEY,
        text_array text[],
        int_array int[],
        bool_array bool[],
        dec_array numeric(5,2)[],
        blob_array bytea[]
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
          sql: `CREATE ACTION insert_all($id uuid, $text_array text[], $int_array int[], $bool_array bool[], $dec_array numeric(5,2)[], $blob_array bytea[]) PUBLIC { 
            INSERT INTO saved_arrays (uuid_col, text_array, int_array, bool_array, dec_array, blob_array) 
            VALUES ($id, $text_array, $int_array, $bool_array, $dec_array, $blob_array); 
          }`,
        },
        {
          name: "insert_text",
          sql: `CREATE ACTION insert_text($id uuid, $text_array text[]) PUBLIC {
            INSERT INTO saved_arrays (uuid_col, text_array) VALUES ($id, $text_array);
          }`,
        },
        {
          name: "insert_int",
          sql: `CREATE ACTION insert_int($id uuid, $int_array int[]) PUBLIC {
            INSERT INTO saved_arrays (uuid_col, int_array) VALUES ($id, $int_array);
          }`,
        },
        {
          name: "insert_dec",
          sql: `CREATE ACTION insert_dec($id uuid, $dec_array numeric(5,2)[]) PUBLIC {
            INSERT INTO saved_arrays (uuid_col, dec_array) VALUES ($id, $dec_array);
          }`,
        },
        {
          name: "insert_bool",
          sql: `CREATE ACTION insert_bool($id uuid, $bool_array bool[]) PUBLIC {
            INSERT INTO saved_arrays (uuid_col, bool_array) VALUES ($id, $bool_array);
          }`,
        },
        {
          name: "insert_blob",
          sql: `CREATE ACTION insert_blob($id uuid, $blob_array bytea[]) PUBLIC {
            INSERT INTO saved_arrays (uuid_col, blob_array) VALUES ($id, $blob_array);
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

  describe("Test variables insertion for arrays", () => {
    it("should be able to insert all variables", async () => {
      const uuid = uuidV4();
      const textArray = ["This is a test text", "This is a test text 2"];
      const intArray = [1, 2, 3, 4, 5];
      const boolArray = [true, false, true, false, true];
      const decArray = [123.45, 123.46, 123.47, 123.48, 123.49];
      const blobArray = [new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array([6, 7, 8, 9, 10])];

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_all",
          inputs: [
            {
              $id: uuid,
              $text_array: textArray,
              $int_array: intArray,
              $bool_array: boolArray,
              $dec_array: decArray,
              $blob_array: blobArray,
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

    it("should be able to insert a record with a text array", async () => {
      const id = uuidV4();
      const textArray = ["This is a test text array test", "This is a test text array 2"];

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_text",
          inputs: [
            {
              $id: id,
              $text_array: textArray,
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
        `{${namespace}} SELECT * FROM ${tableName} WHERE text_array = $text_array`,
        {
          $text_array: textArray,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with an integer", async () => {
      const id = uuidV4();
      const intArray = [6, 7, 8, 9, 10];

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_int",
          inputs: [
            {
              $id: id,
              $int_array: intArray,
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
        `{${namespace}} SELECT * FROM ${tableName} WHERE int_array = $int_array`,
        {
          $int_array: intArray,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with a boolean array", async () => {
      const id = uuidV4();
      const boolArray = [true, false, true, false, true, false, true, false, true, false];

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_bool",
          inputs: [
            {
              $id: id,
              $bool_array: boolArray,
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
        `{${namespace}} SELECT * FROM ${tableName} WHERE bool_array = $bool_array`,
        {
          $bool_array: boolArray,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with a decimal", async () => {
      const id = uuidV4();
      const decArray = [
        123.45, 123.46, 123.47, 123.48, 123.49, 123.5, 123.51, 123.52, 123.53, 123.54,
      ];

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_dec",
          inputs: [
            {
              $id: id,
              $dec_array: decArray,
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
        `{${namespace}} SELECT * FROM ${tableName} WHERE dec_array = $dec_array`,
        {
          $dec_array: decArray,
        },
      );

      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);
    }, 10000);

    it("should be able to insert a record with a blob array", async () => {
      const id = uuidV4();
      const blobArray = [
        new Uint8Array([1, 2, 3, 4, 5]),
        new Uint8Array([6, 7, 8, 9, 10]),
        new Uint8Array([11, 12, 13, 14, 15]),
      ];

      const res = await kwil.execute(
        {
          namespace,
          name: "insert_blob",
          inputs: [
            {
              $id: id,
              $blob_array: blobArray,
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
        `{${namespace}} SELECT * FROM ${tableName} WHERE blob_array = $blob_array`,
        {
          $blob_array: blobArray,
        },
      );
      expect(query.data).toBeDefined();
      expect(query.data).toHaveLength(1);
      expect(Array.isArray(query.data)).toBe(true);
      expect(query.data?.length).toBeGreaterThan(0);

      // base64
      //   const blobVal = query.data[0]?.blob_col as string;
      // expect(base64ToBytes(blobVal)).toStrictEqual(blobArray);
    }, 10000);

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
    it("should NOT be able to insert a number array into text array field", async () => {
      const id = uuidV4();
      const invalidText = [123, 123, 123, 123, 123]; // number instead of text

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_text",
            inputs: [
              {
                $id: id,
                $text_array: invalidText,
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
      const invalidInt = [
        "not a number",
        "not a number",
        "not a number",
        "not a number",
        "not a number",
      ]; // text instead of int

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_int",
            inputs: [
              {
                $id: id,
                $int_array: invalidInt,
              },
            ],
          },
          kwilSigner,
          true,
        ),
      ).rejects.toThrow();
    });

    it("should NOT be able to insert text array into numeric array field", async () => {
      const id = uuidV4();
      const invalidDec = ["123", "123", "123", "123", "123"]; // uuid instead of numeric

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_dec",
            inputs: [
              {
                $id: id,
                $dec_array: invalidDec,
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
      const invalidDec = [12.3, 12.3, 12.3, 12.3, 12.3]; // precision should be 5,2 but we are inserting 3,1

      await expect(
        kwil.execute(
          {
            namespace,
            name: "insert_dec",
            inputs: [
              {
                $id: id,
                $dec_array: invalidDec,
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
