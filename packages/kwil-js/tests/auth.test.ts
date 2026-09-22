import dotenv from "dotenv";

import { KwilSigner } from "../dist";
import { ActionBody, CallBody } from "../dist/core/action";
import { objects } from "../dist/utils/objects";
import { kwil, wallet } from "./testingUtils";

dotenv.config();
const isKgwOn = process.env.GATEWAY_ON === "TRUE";
const isKwildPrivateOn = process.env.PRIVATE_MODE === "TRUE";
const pk =
  "0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75";
let dbid: string = "xd924382720df474c6bb62d26da9aeb10add2ad2835c0b7e4a6336ad8";

const kSigner = new KwilSigner(wallet, pk);

describe("Authentication Tests", () => {
  (isKwildPrivateOn ? describe : describe.skip)("Testing authentication with private mode", () => {
    it("should return a signature", async () => {
      const body: CallBody = {
        namespace: dbid,
        name: "view_must_sign",
      };

      const res = await kwil.auth.authenticatePrivateMode(body, kSigner);

      expect(res.signature).toBeDefined();
      expect(res.signature).toHaveProperty("sig");
      expect(res.signature).toHaveProperty("type");
      expect(res.signature.type).toBe("secp256k1_ep");
      expect(res.signature.sig).toMatch(/^[A-Za-z0-9+/]+={0,2}$/); // Ensure it's a valid base64 string

      expect(res.challenge).toBeDefined();
      expect(res.challenge).toMatch(/^[A-Za-z0-9+/]+={0,2}$/); // Ensure it's a valid base64 string
    });
  });

  (isKgwOn ? describe : describe.skip)("Testing authentication with KGW", () => {
    let cookie: string;

    it("should try to execute a mustsign action and fail", async () => {
      const body: ActionBody = {
        dbid,
        name: "view_must_sign",
      };

      await expect(kwil.call(body, kSigner)).rejects.toThrowError();
    });

    it("should return a cookie", async () => {
      const res = await kwil.auth.authenticateKGW(kSigner);

      expect(res.status).toBe(200);
      expect(res.data?.cookie).toBeDefined();
      expect(res.data?.result).toBeDefined();
      cookie = objects.requireNonNil(res.data?.cookie);
    });

    it("should execute a mustsign action and succeed", async () => {
      const body: ActionBody = {
        dbid,
        name: "view_must_sign",
      };

      const res = await kwil.call(body, kSigner);
      expect(res.status).toBe(200);
      expect(res.data?.result).toBeDefined();
    });
  });
});
