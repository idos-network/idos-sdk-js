import { Utils } from "@idos-network/kwil-js";
import { ActionBody, CallBody, CallBodyNode } from "@idos-network/kwil-js/action";
import { TxReceipt } from "kwil-js-src/core/tx";

import { kwil, kwilSigner, differentKwilSigner, isKwildPrivateOn, isKgwOn } from "./setup";
import { uuidV4 } from "./setup";

// Primary integration tests for Kwil SQL namespace, table and action deployment, calling and executing actions, and dropping operations
describe("SQL Schema Deployment and Management", () => {
  const namespace = "mydb";
  let postId: string;
  let actions: { name: string; sql: string }[];

  describe("Schema Creation", () => {
    it("should create namespace", async () => {
      const result = await kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should not allow creating the same namespace twice", async () => {
      await expect(
        kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner, true),
      ).rejects.toThrow();
    });

    it("should create posts table", async () => {
      const createTable = `{${namespace}} CREATE TABLE posts (id uuid PRIMARY KEY NOT NULL, name text NOT NULL, post_title text NOT NULL, post_body text NOT NULL);`;
      const result = await kwil.execSql(createTable, {}, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should create users table for default param test", async () => {
      const createTable = `{${namespace}} CREATE TABLE users (id int PRIMARY KEY NOT NULL, name text NOT NULL, age int NOT NULL);`;
      const result = await kwil.execSql(createTable, {}, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });
  });

  describe("Action Creation", () => {
    actions = [
      {
        name: "add_post",
        sql: `{${namespace}}CREATE ACTION add_post($id uuid, $user text, $title text, $body text) PUBLIC { INSERT INTO posts (id, name, post_title, post_body) VALUES ($id, $user, $title, $body); }`,
      },
      {
        name: "update_post",
        sql: `{${namespace}}CREATE ACTION update_post($id uuid, $body text) PUBLIC { UPDATE posts SET post_body = $body WHERE id = $id; }`,
      },
      {
        name: "delete_post",
        sql: `{${namespace}}CREATE ACTION delete_post($id uuid) PUBLIC { DELETE FROM posts WHERE id = $id; }`,
      },
      {
        name: "read_posts_count",
        sql: `{${namespace}}CREATE ACTION read_posts_count() PUBLIC VIEW RETURNS (count int) { RETURN SELECT count(*) FROM posts; }`,
      },
      {
        name: "get_post_by_id",
        sql: `{${namespace}}CREATE ACTION get_post_by_id($id uuid) PUBLIC VIEW RETURNS (post_title text, post_body text) { RETURN SELECT post_title, post_body FROM posts WHERE id = $id; }`,
      },
      {
        name: "view_with_param",
        sql: `{${namespace}}CREATE ACTION view_with_param($title text) PUBLIC VIEW RETURNS TABLE (id uuid, name text, post_title text, post_body text) { RETURN SELECT * FROM posts WHERE post_title = $title; }`,
      },
      {
        name: "get_post_by_title",
        sql: `{${namespace}}CREATE ACTION get_post_by_title($title text) PUBLIC VIEW RETURNS (post_title text, post_body text) { for $row in SELECT post_title, post_body FROM posts WHERE post_title = $title { RETURN $row.post_title, $row.post_body; } }`,
      },
      {
        name: "add_user_with_default",
        sql: `{${namespace}}CREATE ACTION add_user_with_default($id int, $name text, $age int DEFAULT 99) PUBLIC { INSERT INTO users (id, name, age) VALUES ($id, $name, $age); }`,
      },
      {
        name: "get_user",
        sql: `{${namespace}}CREATE ACTION get_user($id int) PUBLIC VIEW RETURNS (name text, age int) { RETURN SELECT name, age FROM users WHERE id = $id; }`,
      },
    ];

    actions.forEach((action) => {
      it(`should create "${action.name}" action`, async () => {
        const result = await kwil.execSql(action.sql, {}, kwilSigner, true);
        expect(result.data).toMatchObject<TxReceipt>({
          tx_hash: expect.any(String),
        });
      });
    });
  });

  describe("Direct SQL Operations", () => {
    it("should insert post using execSQL with parameters", async () => {
      const uuid = uuidV4();
      const sql = `{${namespace}} INSERT INTO posts (id, name, post_title, post_body) VALUES ($id, $user, $title, $body)`;
      const params = {
        $id: uuid,
        $user: "TestUser",
        $title: "SQL Test",
        $body: "Testing direct SQL insert",
      };

      const result = await kwil.execSql(sql, params, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
      postId = uuid;
    });

    (!isKwildPrivateOn ? it : it.skip)("should verify post exists using selectQuery", async () => {
      const query = `{${namespace}} SELECT post_title, post_body FROM posts WHERE id = $id`;
      const params = {
        $id: postId,
      };
      const result = await kwil.selectQuery(query, params);

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toMatchObject({
        post_title: "SQL Test",
        post_body: "Testing direct SQL insert",
      });
    });
  });

  describe("Action Testing", () => {
    let actionPostId: string = "123e4567-e89b-12d3-a456-426614174005";

    it("should execute add_post action", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_post",
        inputs: [
          {
            $id: actionPostId,
            $user: "TestUser",
            $title: "Action Test",
            $body: "Testing action execution",
          },
        ],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should bulk execute actions", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_post",
        inputs: [
          {
            $id: uuidV4(),
            $user: "TestUser",
            $title: "Bulk Test 1",
            $body: "Testing bulk action execution 1",
          },
          {
            $id: uuidV4(),
            $user: "TestUser",
            $title: "Bulk Test 2",
            $body: "Testing bulk action execution 2",
          },
        ],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should execute update_post action", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "update_post",
        inputs: [
          {
            $id: actionPostId,
            $body: "Updated post body",
          },
        ],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    (!isKwildPrivateOn ? it : it.skip)("should verify post exists using selectQuery", async () => {
      const query = `{${namespace}} SELECT post_title, post_body FROM posts WHERE id = $id`;
      const params = {
        $id: actionPostId,
      };
      const result = await kwil.selectQuery(query, params);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toMatchObject({
        post_title: "Action Test",
        post_body: "Updated post body",
      });
    });

    (!isKwildPrivateOn && !isKgwOn ? it : it.skip)(
      "should execute read_posts_count view action without signer or inputs",
      async () => {
        const actionBody: CallBody = {
          namespace,
          name: "read_posts_count",
        };

        const result = await kwil.call(actionBody);
        if (result.data) {
          expect(result.data).toMatchObject({
            result: [{ count: "4" }],
          });
        } else {
          throw new Error("No data returned from action execution");
        }
      },
    );

    it("should execute get_post_by_id view action with signer", async () => {
      const actionBody: CallBody = {
        namespace,
        name: "get_post_by_id",
        inputs: {
          $id: actionPostId,
        },
      };

      const result = await kwil.call(actionBody, kwilSigner);
      if (result.data) {
        expect(result.data?.result && result.data.result[0]).toMatchObject({
          post_title: "Action Test",
          post_body: "Updated post body",
        });
      } else {
        throw new Error("No data returned from action execution");
      }
    });

    it("should execute view_with_param view action", async () => {
      const actionBody: CallBody = {
        namespace,
        name: "view_with_param",
        inputs: {
          $title: "Action Test",
        },
      };

      const result = await kwil.call(actionBody, kwilSigner);
      if (result.data) {
        expect(result.data.result).toHaveLength(1);
        expect(result.data?.result && result.data.result[0]).toMatchObject({
          post_title: "Action Test",
          post_body: "Updated post body",
        });
      } else {
        throw new Error("No data returned from action call");
      }
    });

    it("should execute view_with_param view action with ActionInputs", async () => {
      const actionInputData = Utils.ActionInput.of().put("$title", "Action Test");

      const actionBody: CallBody = {
        namespace,
        name: "view_with_param",
        inputs: [actionInputData],
      };

      const result = await kwil.call(actionBody, kwilSigner);
      if (result.data) {
        expect(result.data.result).toHaveLength(1);
        expect(result.data?.result && result.data.result[0]).toMatchObject({
          post_title: "Action Test",
          post_body: "Updated post body",
        });
      } else {
        throw new Error("No data returned from action execution");
      }
    });

    it("should execute view_with_param view action with a different signer", async () => {
      const actionBody: CallBody = {
        namespace,
        name: "view_with_param",
        inputs: {
          $title: "Action Test",
        },
      };

      // TODO: Need to test without kwilSigner

      interface ViewWithParam {
        id: string;
        name: string;
        post_title: string;
        post_body: string;
      }

      const result = await kwil.call<ViewWithParam>(actionBody, differentKwilSigner);
      if (result.data) {
        expect(result.data.result).toHaveLength(1);
        expect(result.data?.result && result.data.result[0]).toMatchObject({
          post_title: "Action Test",
          post_body: "Updated post body",
        });
      } else {
        throw new Error("No data returned from action execution");
      }
    });

    it("should execute update_post action using dbid instead of namespace", async () => {
      const actionBody: ActionBody = {
        namespace,
        dbid: namespace,
        name: "update_post",
        inputs: [
          {
            $id: actionPostId,
            $body: "Another updated post body",
          },
        ],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should execute delete_post action", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "delete_post",
        inputs: [
          {
            $id: actionPostId,
          },
        ],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should execute an action with positional parameters", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_post",
        inputs: [[uuidV4(), "TestUser", "Positional Test", "Testing positional parameters"]],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should bulk execute actions with positional parameters", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_post",
        inputs: [
          [uuidV4(), "TestUser", "Bulk Positional 1", "Testing bulk positional parameters 1"],
          [uuidV4(), "TestUser", "Bulk Positional 2", "Testing bulk positional parameters 2"],
        ],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should call an action with positional parameters", async () => {
      const actionBody: CallBodyNode = {
        namespace,
        name: "get_post_by_title",
        inputs: ["Positional Test"],
      };

      interface GetPostByTitle {
        post_title: string;
        post_body: string;
      }

      const result = await kwil.call<GetPostByTitle>(actionBody, kwilSigner);
      if (result.data) {
        expect(result.data.result).toHaveLength(1);
        expect(result.data?.result && result.data.result[0]).toMatchObject({
          post_title: "Positional Test",
          post_body: "Testing positional parameters",
        });
      } else {
        throw new Error("No data returned from action call");
      }
    });

    it("should execute add_user_with_default action without the default parameter", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "add_user_with_default",
        inputs: [
          {
            $id: 1,
            $name: "John Doe",
          },
        ],
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should verify the user was created with the default age", async () => {
      const actionBody: CallBody = {
        namespace,
        name: "get_user",
        inputs: {
          $id: 1,
        },
      };

      const result = await kwil.call(actionBody, kwilSigner);
      if (result.data) {
        expect(result.data?.result && result.data.result[0]).toMatchObject({
          name: "John Doe",
          age: "99",
        });
      } else {
        throw new Error("No data returned from action execution");
      }
    });
  });

  describe("Error Cases", () => {
    it("should not allow calling action from non-existent namespace", async () => {
      const actionBody: ActionBody = {
        namespace: "wrong_namespace",
        name: "add_post",
        inputs: [
          {
            $user: "TestUser",
            $title: "Should Fail",
            $body: "This should fail",
          },
        ],
      };

      await expect(kwil.execute(actionBody, kwilSigner, true)).rejects.toThrow();
    });

    it("should fail when calling non-existent action", async () => {
      const actionBody: ActionBody = {
        namespace,
        name: "non_existent_action",
        inputs: [
          {
            $user: "TestUser",
          },
        ],
      };

      await expect(kwil.execute(actionBody, kwilSigner, true)).rejects.toThrow();
    });

    it("should NOT drop posts table with wrong signer", async () => {
      await expect(
        kwil.execSql("DROP TABLE posts;", {}, differentKwilSigner, true),
      ).rejects.toThrow(/user does not have privilege DROP on namespace/);
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

    it("should drop posts table", async () => {
      const result = await kwil.execSql(`{${namespace}} DROP TABLE posts;`, {}, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should drop users table", async () => {
      const result = await kwil.execSql(`{${namespace}} DROP TABLE users;`, {}, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });

    it("should drop namespace", async () => {
      const result = await kwil.execSql(`DROP NAMESPACE ${namespace};`, {}, kwilSigner, true);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    });
  });
});
