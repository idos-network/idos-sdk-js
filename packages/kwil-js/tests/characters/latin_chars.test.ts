import { Wallet } from "ethers";

import { KwilSigner } from "../../dist";
import { ActionBody } from "../../dist/core/action";
import { kwil } from "../testingUtils";
import schema from "./latin_schema.json";

const latin_chars = [
  "è",
  "é",
  "é",
  "ê",
  "ë",
  "ì",
  "í",
  "î",
  "ï",
  "ñ",
  "ò",
  "ó",
  "ô",
  "õ",
  "ö",
  "ù",
  "ú",
  "û",
  "ü",
  "ý",
  "ÿ",
  "ç",
  "È",
  "É",
  "Ê",
  "Ë",
  "Ì",
  "Í",
  "Î",
  "Ï",
  "Ñ",
  "Ò",
  "Ó",
  "Ô",
  "Õ",
  "Ö",
  "Ù",
  "Ú",
  "Û",
  "Ü",
  "Ý",
  "Ç",
];
// const latin_chars = ['é']
const wallet = Wallet.createRandom();

const signer = new KwilSigner(wallet, wallet.address);

const dbid = kwil.getDBID(wallet.address, "latin_schema");

describe("Latin characters", () => {
  beforeAll(async () => {
    // deploy db
    await kwil.deploy(
      {
        schema,
      },
      signer,
      true,
    );
  });

  afterAll(async () => {
    // drop db
    await kwil.drop(
      {
        dbid,
      },
      signer,
      true,
    );
  });

  for (const char of latin_chars) {
    it(`should store and query for ${char}`, async () => {
      const payload: ActionBody = {
        dbid,
        name: "insert_char",
        inputs: [
          {
            $id: 1,
            $char: char,
          },
        ],
      };

      // execute the transaction
      await kwil.execute(payload, signer, true);

      // query
      const query: ActionBody = {
        dbid,
        name: "get_char",
        inputs: [
          {
            $id: 1,
          },
        ],
      };

      const { data } = await kwil.call(query);

      expect(data?.result).toEqual([
        {
          special_character: char,
        },
      ]);

      //  delete the data

      const deletePayload: ActionBody = {
        dbid,
        name: "delete_char",
        inputs: [
          {
            $id: 1,
          },
        ],
      };

      await kwil.execute(deletePayload, signer, true);
    }, 20000);
  }
});
