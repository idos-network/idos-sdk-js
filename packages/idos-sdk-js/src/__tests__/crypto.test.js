import { expect, test } from "vitest";
import { Crypto } from "../lib/crypto";

test("instantiates a `Crypto` instance", () => {
  const crypto = new Crypto({});
  expect(crypto).toBeDefined();
});
