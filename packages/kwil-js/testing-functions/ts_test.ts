import { BrowserProvider, encodeRlp, Wallet } from "ethers";

import { ActionBody, PositionalParams, transformPositionalParam } from "../src/core/action";
import { KwilSigner, NodeKwil, Utils } from "../src/index";
// import { DeployBody, DropBody } from '../dist/core/database';
// import compiledKf from './mydb.json';
// import { TransferBody } from '../dist/funder/funding_types';
// require('dotenv').config();

const kwil = new NodeKwil({
  kwilProvider: process.env.KWIL_PROVIDER as string,
  chainId: "",
  logging: true,
});

import { bytesToBase64 } from "../src/utils/base64";
import { numberToBytes } from "../src/utils/serial";

// add window.ethereum to typeof globalthis
declare global {
  interface Window {
    ethereum: any;
  }
}

async function buildSigner() {
  const wallet = new Wallet(process.env.PRIVATE_KEY as string);
  return new KwilSigner(wallet, await wallet.getAddress());
}

async function main() {
  const signer = await buildSigner();

  // // actions
  // const actionBody: ActionBody = {
  //   dbid: kwil.getDBID(signer.identifier, 'mydb'),
  //   name: 'add_post',
  //   namespace: 'main',
  //   inputs: [
  //     {
  //       $id: 69,
  //       $user: 'Luke',
  //       $title: 'Test Post',
  //       $body: 'This is a test post',
  //     },
  //   ],
  //   description: 'Add a post',
  // };

  // // execute
  // await kwil.execute(actionBody, signer);

  // //call with signer
  // // const callRes = await kwil.call(actionBody, signer);
  // // console.log(callRes);

  // //call without signer
  // // await kwil.call(actionBody);

  // // deploy database
  // const deployBody: DeployBody = {
  //   schema: compiledKf,
  //   description: 'My first database',
  // };

  // // deploy
  // // await kwil.deploy(deployBody, signer, true);

  // // drop database
  // const dropBody: DropBody = {
  //   dbid: 'abc123',
  //   description: 'Drop this database',
  // };

  // // drop
  // // await kwil.drop(dropBody, signer);

  // const funderTest: TransferBody = {
  //   to: '0xdB8C53Cd9be615934da491A7476f3f3288d98fEb',
  //   amount: BigInt(1 * 10 ** 18),
  // };

  // transfer
  // const res = await kwil.funder.transfer(funderTest, signer);
  // console.log(res);

  // chainInfo
}

main();

// async function nilTest() {
//   const signer = await buildSigner();
//   // await kwil.deploy({ schema: nilKf }, signer, true);
//   const { data } = await kwil.selectQuery(
//     kwil.getDBID(signer.identifier, 'nil_error'),
//     'SELECT COUNT(*) FROM nil_table'
//   )

//   console.log(data);

//   //@ts-ignore
//   const count = data[0]['count'];
//   console.log(`Count: ${count}`);

//   let oneHundredInputs: any[] = [];

//   for (let i = 1; i < 1000; i++) {
//     oneHundredInputs.push({
//       // random 10000000000000 digit number
//       $id: Math.floor(Math.random() * 10000000000000),
//       $msg: null,
//     });
//   }

//   // const res = await kwil.execute(
//   //   {
//   //     dbid: kwil.getDBID(signer.identifier, 'nil_error'),
//   //     action: 'insert_record',
//   //     inputs: oneHundredInputs,
//   //   },
//   //   signer,
//   //   true
//   // );

//   // console.log(res);

//   // const test = await kwil.selectQuery(
//   //   kwil.getDBID(signer.identifier, 'nil_error'),
//   //   'SELECT * FROM nil_table'
//   // )

//   // console.log(test.data);
// }

// // nilTest();

// // async function rlp_test(val: string) {
// //   const rlpVal = encodeRlp(inputToHex(val));
// //   const encodingType = numberToUint16BigEndian(EncodingType.RLP_ENCODING);
// //   const bytes = concatBytes(encodingType, hexToBytes(rlpVal));

// //   console.log(bytesToBase64(bytes))
// // }

// import { parse, v4 } from 'uuid';

// function test() {
//   // handling numbers
//   const bytes = numberToBytes(1)
//   console.log(bytesToBase64(bytes))

//   // handling uuids
//   // for martin - how should we handle when a user passes a UUID to kwil-js?
//   // I see two options (if there are others though, feel free to propose):
//   //  - Option 1: We check each string that is passed to see if it conforms to a uuid string. If yes, we assume the variable is of uuid type and pass accordingly.
//   //  - Option 2: We create a class (e.g., UUID), that users must use each time they want to query. Example:
//   //    await kwil.selectQuery('SELECT * FROM my_table WHERE id = $my_uuid, {$my_uuid: new UUID("123e4567-e89b-12d3-a456-426614174000")})
//   const bt2 = parse('123e4567-e89b-12d3-a456-426614174000')
//   console.log(bytesToBase64(bt2))

// }

// // test()
