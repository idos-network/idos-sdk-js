// this file is mostly for if i want to call a function quickly without having to run the whole test suite
// this is not a part of the test suite and should not be run by jest

const kwiljs = require('../dist/index');
const ethers = require('ethers');
const testDB = require('./mydb.json');
const baseSchema = require('./base_schema.json');
const util = require('util');
const near = require('near-api-js');
const { from_b58 } = require('../dist/utils/base58');
const { bytesToHex, hexToBytes, stringToBytes, bytesToEthHex } = require('../dist/utils/serial');
const { bytesToBase64, base64ToBytes } = require('../dist/utils/base64');
const scrypt = require('scrypt-js');
const nacl = require('tweetnacl');
const { sha256BytesToBytes } = require('../dist/utils/crypto');
const { KwilSigner } = require('../dist/core/kwilSigner');
const { ActionInput } = require('../dist/core/action');
const { randomUUID } = require('crypto');
require('dotenv').config();

const chainId = process.env.CHAIN_ID || 'SHOULD FAIL';

function logger(msg) {
  console.log(util.inspect(msg, false, null, true /* enable colors */));
}

async function scratchpad() {
  //update to goerli when live
  const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // signer
  const txHash = '90a922292d2a057c0ea9d8f34162a4ba1673c8c7146a565ca66c90b40b42b150';
  const address = wallet.address; // address

  const getEdKeys = async () => {
    const key = await deriveKeyPair64('password', 'humanId');
    return key;
  };

  const kwil = new kwiljs.NodeKwil({
    kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
    chainId: chainId,
    timeout: 10000,
    logging: true,
  });

  const kwilSigner = new KwilSigner(wallet, address);
  //   console.log(kwilSigner)

  async function testMultiLogout() {
    const ethWallet1 = ethers.Wallet.createRandom();
    const ethWallet2 = ethers.Wallet.createRandom();

    const kwilSigner1 = new KwilSigner(ethWallet1, ethWallet1.address);
    const kwilSigner2 = new KwilSigner(ethWallet2, ethWallet2.address);

    console.log('wallet1, wallet2', ethWallet1.address, ethWallet2.address);

    const res1 = await kwil.auth.authenticate(kwilSigner1);
    logger(res1);
    logger('Logged in with wallet 1');
    const res2 = await kwil.auth.authenticate(kwilSigner2);
    logger(res2);
    logger('Logged in with wallet 2');

    const res3 = await kwil.auth.logout(kwilSigner1);
    logger(res3);
    logger('Logged out with wallet 1');
  }

  // testMultiLogout()

  // const dbid = kwil.getDBID(address, 'social');
  const dbid = 'xe3cf0579c3adeeceef9d827357316d54e12f27bfc2cfb0a1b005152c'
  // console.log("social dbid ", dbid)
  // await authenticate(kwil, kwilSigner)
  // broadcast(kwil, testDB, kwilSigner)
  // broadcastEd25519(kwil, testDB)
  // await getTxInfo(kwil, txHash)
  // await getSchema(kwil, 'xe04718a9b8780a0b61fbc082b5493d19f5202b5bd6af4d75072b3193')
  // getAccount(kwil, address)
  // listDatabases(kwil)
  // ping(kwil)
  //   chainInfo(kwil)
  // await execSingleAction(kwil, 'main', "add_post", wallet, address)
  // await execSingleActionKwilSigner(kwil, dbid, "add_post", kwilSigner)
  // await select(kwil, dbid, "SELECT * FROM primitive_events")
  // bulkAction(kwil, dbid, "add_post", wallet, address)
  // await testViewWithParam(kwil, dbid, wallet)
  // await testViewWithSign(kwil, dbid, kwilSigner)
  // await testViewWithEdSigner(kwil, dbid)
  // await customSignature(kwil, dbid)
  // await julioSignature(kwil, dbid)
  // await customEd25519(kwil, dbid)
  // await dropDb(kwil, kwilSigner, dbid);
  // await transfer(kwil, "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf", 20, kwilSigner)
  // bulkActionInput(kwil, kwilSigner)
  // console.log(base64ToBytes('QVFJREJBVUdCd2dKQ2c9PQ=='))

  const user = {
    $id: 1,
    $username: 'Tyler',
    $age: 28,
  };

  const userId = {
    $id: 1
  }

  const post = {
    $id: randomUUID(),
    $user: 'Luke',
    $title: 'Positional Test',
    $body: 'Hello World',
  };
  // executeGeneralAction(kwil, 'main', 'add_post', kwilSigner, post);
  // await executeGeneralView(kwil, 'main', 'return_caller', null, kwilSigner);
  // await executeGeneralView(kwil, dbid, "view_must_sign", null, kwilSigner)
  await executePositionalView(kwil, 'main', 'return_all')   

  // await execSql(kwil,
  //   'INSERT INTO number (id) VALUES ($id)',
  //   { $id: 4 },
  //   kwilSigner
  // )
}

scratchpad();

async function execSql(kwil, query, params, signer) {
  const res = await kwil.execSql(query, params, signer, false);
  logger(res);
}

async function executePositionalView(kwil, namespace, name) {
  const body = {
    namespace,
    name,
    inputs: [],
  };

  const res = await kwil.call(body);
  logger(res);
}

async function executeGeneralView(kwil, dbid, name, input, signer) {
  const body = {
    name,
    dbid,
    ...(input ? { inputs: [input] } : {}),
  };

  const res = await kwil.call(body, signer);
  logger(res);
}

async function executeGeneralAction(kwil, dbid, name, wallet, input) {
  const body = {
    name,
    namespace: dbid,
    inputs: [{ $id:1}]
  };

  const res = await kwil.execute(body, wallet, true);

  logger(res);
}

async function authenticate(kwil, signer) {
  const res = await kwil.auth.authenticate(signer);
  logger(res);
}

async function getSchema(kwil, d) {
  const res = await kwil.getSchema(d);
  const schema = res.data;
  logger(res);
}

async function getAccount(kwil, owner) {
  const account = await kwil.getAccount(owner);
  logger(account);
}

async function broadcast(kwil, tx, kwilSigner) {
  let ownedTx = tx;
  ownedTx.owner = kwilSigner.identifier;

  const payload = {
    schema: ownedTx,
  };

  const txHash = await kwil.deploy(payload, kwilSigner, true);

  logger(txHash);
}

async function listDatabases(kwil, owner) {
  const databases = await kwil.listDatabases();
  logger(databases);
}

async function ping(kwil) {
  const ping = await kwil.ping();
  logger(ping);
}

async function chainInfo(kwil) {
  const info = await kwil.chainInfo();
  logger(info);
}

async function getAction(kwil) {
  const res = await kwil.actionBuilder();
  logger(res);
}

async function execSingleAction(kwil, dbid, action, w, pubKey) {
  const query = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');

  const count = query.data[0][`count`];

  const Input = kwiljs.Utils.ActionInput;

  const solo = Input.of()
    .put('$id', count + 1)
    .put('$user', 'Luke')
    .put('$title', 'Hello')
    .put('$body', 'Hello World');

  let act = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name(action)
    .concat(solo)
    .description('This is my friendly description!')
    .publicKey(pubKey)
    .signer(w)
    .buildTx();

  const startTime = Date.now();

  const res = await kwil.broadcast(act, 2);

  logger(res);
}

async function execSingleActionKwilSigner(kwil, dbid, action, kSigner) {
  const query = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
  const count = query.data[0][`count`];

  const Input = kwiljs.Utils.ActionInput.of()
    .put('$id', count + 1)
    .put('$user', 'Luke')
    .put('$title', 'Hello')
    .put('$body', 'Hello World');

  const body = {
    dbid,
    action,
    inputs: [Input],
    description: 'This is my friendly description!',
  };

  const startTime = Date.now();
  const res = await kwil.execute(body, kSigner, true);
  const endTime = Date.now();
  console.log(`Time: ${endTime - startTime}ms`);

  logger(res);
}

async function select(kwil, dbid, query) {
  const res = await kwil.selectQuery(dbid, query);
  logger(res);
}

async function configObj(kwil, dbid) {
  const query = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');

  const count = query.data[0][`count`];

  const bulkActions = [
    {
      $id: count + 1,
      $user: 'Luke',
      $title: 'Hello',
      $body: 'Hello World',
    },
    {
      $id: count + 2,
      $user: 'Luke',
      $title: 'Hello',
      $body: 'Hello World 2',
    },
    {
      $id: count + 3,
      $user: 'Luke',
      $title: 'Hello',
      $body: 'Hello World 3',
    },
  ];

  return bulkActions;
}

async function bulkAction(kwil, dbid, action, w, pubKey) {
  const data = await configObj(kwil, dbid);

  const Input = kwiljs.Utils.ActionInput;

  const inputs = new Input().putFromObjects(data);

  const tx = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name(action)
    .concat(inputs)
    .publicKey(pubKey)
    .signer(w)
    .buildTx();

  const res = await kwil.broadcast(tx, 2);

  logger(res);
}

async function getTxInfo(kwil, hash) {
  const res = await kwil.txInfo(hash);
  logger(res);
}

async function dropDb(kwil, signer, dbid) {
  const body = {
    dbid: dbid,
    description: 'show me this',
  };
  const res = await kwil.drop(body, signer, true);

  logger(res);
}

async function testViewWithParam(kwil, dbid, wallet) {
  const actionInput = kwiljs.Utils.ActionInput.of().put('$id', 1);

  const msg = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name('view_with_param')
    .concat(actionInput)
    .buildMsg();

  logger(msg);

  const res = await kwil.call(msg);

  logger(res.data.result);
}

async function testReadPost(kwil, dbid) {
  const body = {
    action: 'read_posts',
    dbid,
  };

  const res = await kwil.call(body);

  logger(res);
}

async function testViewWithSign(kwil, dbid, signer) {
  const body = {
    action: 'view_must_sign',
    dbid,
    inputs: [],
  };

  const res = await kwil.call(body, signer);

  logger(res);
}

async function testViewWithEdSigner(kwil, dbid) {
  const key = await deriveKeyPair64('password', 'humanId');

  const signCallback = (msg) => nacl.sign.detached(msg, key.secretKey);

  const kwilSigner = new KwilSigner(signCallback, key.publicKey, 'ed25519');

  const body = {
    action: 'view_must_sign',
    dbid,
  };

  const res = await kwil.call(body, kwilSigner);

  logger(res);
}

async function broadcastEd25519(kwil, db) {
  const key = await deriveKeyPair64('password', 'humanId');

  const signCallback = (msg) => nacl.sign.detached(msg, key.secretKey);

  const signer = new KwilSigner(signCallback, key.publicKey, 'ed25519');

  const res = await kwil.deploy(
    {
      schema: db,
    },
    signer
  );

  logger(res);
}

async function recoverPubKey(signer) {
  return await kwiljs.Utils.recoverSecp256k1PubKey(signer);
}

function decodebase58(string) {
  console.log(bytesToHex(from_b58(string)));
}

async function customSignature(kwil, dbid) {
  const query = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');

  const count = query.data[0][`COUNT(*)`];

  const Input = kwiljs.Utils.ActionInput;

  const solo = Input.of()
    .put('$id', count + 1)
    .put('$user', 'Luke')
    .put('$title', 'Hello')
    .put('$body', 'Hello World');

  const key = await deriveKeyPair64('password', 'humanId');

  const signCallback = (msg) => nacl.sign.detached(msg, key.secretKey);

  const tx = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name('add_post')
    .concat(solo)
    .publicKey(key.publicKey)
    .signer(signCallback, 'ed25519')
    .buildTx();

  const res = await kwil.broadcast(tx);

  logger(res);
}

async function julioSignature(kwil, dbid) {
  const key = await deriveKeyPair64('password', 'humanId');

  const signer = {
    signMessage: async (msg) => {
      return nacl.sign.detached(msg, key.secretKey);
    },
  };

  const msg = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name('view_must_sign')
    .publicKey(key.publicKey)
    .signer(signer.signMessage, 'ed25519')
    .buildMsg();

  const res = await kwil.call(msg);

  logger(res);
}

const deriveKeyPair64 = async (password, humanId) => {
  const encoder = new TextEncoder();

  const normalizedPassword = encoder.encode(password.normalize('NFKC'));
  const salt = encoder.encode(humanId);

  const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

  return nacl.sign.keyPair.fromSeed(derivedKey);
};

async function customEd25519(kwil, dbid) {
  const query = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');

  const count = query.data[0][`COUNT(*)`];

  const Input = kwiljs.Utils.ActionInput;

  const solo = Input.of()
    .put('$id', count + 1)
    .put('$user', 'Luke')
    .put('$title', 'Hello')
    .put('$body', 'Hello World');

  const keys = nacl.sign.keyPair();
  const customSigner = (msg) => nacl.sign.detached(msg, keys.secretKey);

  const tx = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name('add_post')
    .concat(solo)
    .publicKey(keys.publicKey)
    .signer(customSigner, 'ed25519')
    .buildTx();

  const res = await kwil.broadcast(tx);

  logger(res);
}

async function transfer(kwil, to, tokenAmnt, signer) {
  const payload = {
    to,
    amount: BigInt(tokenAmnt),
  };

  const res = await kwil.funder.transfer(payload, signer);
  logger(res);
}

async function bulkActionInput(kwil, signer) {
  const dbid = kwil.getDBID(signer.identifier, 'mydb');
  const query = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
  const count = query.data[0][`COUNT(*)`];

  let inputs = [];

  for (let i = 0; i < 100; i++) {
    inputs.push(
      ActionInput.fromObject({
        $id: count + i,
        $user: 'Luke',
        $title: 'Hello',
        $body: 'Hello World',
      })
    );
  }

  console.log(inputs);

  const body = {
    dbid,
    action: 'add_post',
    inputs,
    description: 'This is my friendly description!',
  };

  const res = await kwil.execute(body, signer);

  logger(res);
}
