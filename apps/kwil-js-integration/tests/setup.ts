import { KwilSigner, NodeKwil, Utils } from "@idos-network/kwil-js";
import dotenv from "dotenv";
import { JsonRpcProvider, Wallet } from "ethers";
import { TxReceipt } from "kwil-js-src/core/tx";
import { HexString } from "kwil-js-src/utils/types";
import scrypt from "scrypt-js";
import nacl from "tweetnacl";
import { v4 as uuidV4 } from "uuid";

dotenv.config();

const isKgwOn = process.env.GATEWAY_ON === "TRUE";
const isKwildPrivateOn = process.env.PRIVATE_MODE === "TRUE";
const isGasOn = process.env.GAS_ON === "TRUE";

const provider = new JsonRpcProvider(process.env.ETH_PROVIDER);
const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider);

const kwil = new NodeKwil({
  kwilProvider: process.env.KWIL_PROVIDER || "SHOULD FAIL",
  chainId: process.env.CHAIN_ID || "SHOULD FAIL",
  timeout: 10000,
  logging: true,
  unconfirmedNonce: true,
});

const address = wallet.address;
const kwilSigner = new KwilSigner(wallet, address);

const diffWallet = Wallet.createRandom();
const differentKwilSigner = new KwilSigner(diffWallet, diffWallet.address);

const deriveKeyPair64 = async (password: string, humanId: string) => {
  const encoder = new TextEncoder();

  const normalizedPassword = encoder.encode(password.normalize("NFKC"));
  const salt = encoder.encode(humanId);

  const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

  return nacl.sign.keyPair.fromSeed(derivedKey);
};

export const createVariableTestSchema = async (namespace: string, actions: any[]) => {
  const result = await kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner);
  expect(result.data).toMatchObject<TxReceipt>({
    tx_hash: expect.any(String),
  });

  // Create table
  const createTable = `${namespace} CREATE TABLE var_table (
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

  for (const action of actions) {
    const actionResult = await kwil.execSql(action.sql, {}, kwilSigner, true);
    expect(actionResult.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }
};

// Define the actions outside the functions for reuse
const testActions = [
  {
    name: "add_post",
    sql: `CREATE ACTION add_post($id uuid, $user text, $title text, $body text) PUBLIC { INSERT INTO posts (id, name, post_title, post_body) VALUES ($id, $user, $title, $body); }`,
  },
  {
    name: "update_post",
    sql: `CREATE ACTION update_post($id uuid, $body text) PUBLIC { UPDATE posts SET post_body = $body WHERE id = $id; }`,
  },
  {
    name: "add_post_no_param",
    sql: `CREATE ACTION add_post_no_param() PUBLIC { INSERT INTO posts (id, name, post_title, post_body) VALUES ('${uuidV4()}'::uuid, 'TestUser', 'Action Test', 'Testing action execution'); }`,
  },
  {
    name: "delete_post",
    sql: `CREATE ACTION delete_post($id uuid) PUBLIC { DELETE FROM posts WHERE id = $id; }`,
  },
  {
    name: "read_posts_count",
    sql: `CREATE ACTION read_posts_count() PUBLIC VIEW RETURNS (count int) { RETURN SELECT count(*) FROM posts; }`,
  },
  {
    name: "get_post_by_id",
    sql: `CREATE ACTION get_post_by_id($id uuid) PUBLIC VIEW RETURNS (post_title text, post_body text) { RETURN SELECT post_title, post_body FROM posts WHERE id = $id; }`,
  },
  {
    name: "view_with_param",
    sql: `CREATE ACTION view_with_param($title text) PUBLIC VIEW RETURNS TABLE (id uuid, name text, post_title text, post_body text) { RETURN SELECT * FROM posts WHERE post_title = $title; }`,
  },
  {
    name: "get_post_by_title",
    sql: `CREATE ACTION get_post_by_title($title text) PUBLIC VIEW RETURNS (post_title text, post_body text) { for $row in SELECT post_title, post_body FROM posts WHERE post_title = $title { RETURN $row.post_title, $row.post_body; } ERROR(format('record with title = "%s" not found', $title)); }`,
  },
];

const gatewayActions = [
  {
    name: "view_must_sign",
    sql: `CREATE ACTION view_must_sign() PUBLIC VIEW RETURNS TABLE (id uuid, name text, post_title text, post_body text) { RETURN SELECT * FROM posts; }`,
  },
  {
    name: "view_caller",
    sql: `CREATE ACTION view_caller() PUBLIC VIEW RETURNS (caller text) { RETURN @caller; }`,
  },
];

async function createTestSchema(namespace: string, kwil: any, kwilSigner: any) {
  // Create namespace
  await kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner, true);

  // Create posts table
  const createTable = `{${namespace}} CREATE TABLE posts (id uuid PRIMARY KEY NOT NULL, name text NOT NULL, post_title text NOT NULL, post_body text NOT NULL);`;
  await kwil.execSql(createTable, {}, kwilSigner, true);

  // Create actions
  for (const action of testActions) {
    await kwil.execSql(`{${namespace}} ${action.sql}`, {}, kwilSigner, true);
  }
}

async function createGatewayActions(namespace: string, kwil: any, kwilSigner: any) {
  for (const action of gatewayActions) {
    await kwil.execSql(`{${namespace}} ${action.sql}`, {}, kwilSigner, true);
  }
}

async function grantAdminAccess(ident: HexString) {
  await kwil.execSql("CREATE ROLE IF NOT EXISTS admin", {}, kwilSigner, true);
  await kwil.execSql("GRANT IF NOT GRANTED CREATE TO admin", {}, kwilSigner, true);
  await kwil.execSql(`GRANT IF NOT GRANTED DROP TO admin`, {}, kwilSigner, true);
  await kwil.execSql(
    `GRANT IF NOT GRANTED admin TO $ident`,
    {
      $ident: ident,
    },
    kwilSigner,
    true,
  );
}

async function dropTestSchema(namespace: string, kwil: any, kwilSigner: any) {
  // Drop namespace
  await kwil.execSql(`DROP NAMESPACE ${namespace};`, {}, kwilSigner, true);
}

const { DataType } = Utils;

export {
  kwil,
  wallet,
  deriveKeyPair64,
  isKgwOn,
  isKwildPrivateOn,
  isGasOn,
  address,
  kwilSigner,
  differentKwilSigner,
  uuidV4,
  createTestSchema,
  createGatewayActions,
  dropTestSchema,
  testActions,
  grantAdminAccess,
  DataType,
};
