// Ported from https://github.com/noseglid/base85/tree/master/tests (ascii85 only)
// and https://github.com/noseglid/base85/pull/25.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { base85ToFile, fileToBase85 } from "./index.js";

const fixture = (name: string) => readFileSync(path.join(__dirname, "test", name));

const cases: [Buffer, string][] = [
  [Buffer.from("Man "), "<~9jqo^~>"],
  [Buffer.from("Man a"), "<~9jqo^@/~>"],
  [Buffer.from("Man ab"), "<~9jqo^@:B~>"],
  [Buffer.from("Man abc"), "<~9jqo^@:E^~>"],
  [Buffer.from("Man abcd"), "<~9jqo^@:E_W~>"],
  [Buffer.from("Hello, world!!!!"), "<~87cURD_*#TDfTZ)+X&!P~>"],
  [Buffer.from(""), "<~~>"],
  [
    Buffer.from(
      "Man is distinguished, not only by his reason, but by this singular passion " +
        "from other animals, which is a lust of the mind, that by a perseverance of " +
        "delight in the continued and indefatigable generation of knowledge, exceeds " +
        "the short vehemence of any carnal pleasure",
    ),
    "<~9jqo^BlbD-BleB1DJ+*+F(f,q/0JhKF<GL>Cj@.4Gp$d7F!,L7@<6@)/0JDEF" +
      '<G%<+EV:2F!,O<DJ+*.@<*K0@<6L(Df-\\0Ec5e;DffZ(EZee.Bl.9pF"AGXBPC' +
      "si+DGm>@3BB/F*&OCAfu2/AKYi(DIb:@FD,*)+C]U=@3BN#EcYf8ATD3s@q?d$A" +
      "ftVqCh[NqF<G:8+EV:.+Cf>-FD5W8ARlolDIal(DId<j@<?3r@:F%a+D58'ATD" +
      "4$Bl@l3De:,-DJs`8ARoFb/0JMK@qB4^F!,R<AKZ&-DfTqBG%G>uD.RTpAKYo'" +
      "+CT/5+Cei#DII?(E,9)oF*2M7~>",
  ],
  [Buffer.from([0xff]), "<~rr~>"],
  [Buffer.from([0xff, 0xff, 0xff, 0xff]), "<~s8W-!~>"],
  [Buffer.from(" "), "<~+9~>"],
  [Buffer.from([0, 0, 0, 0]), "<~z~>"],
  [Buffer.from([0x86, 0x4f, 0xd2, 0x6f, 0xb5, 0x59, 0xf7, 0x5b]), "<~L/669[9<6.~>"],
  [
    Buffer.from([
      0x8e, 0x0b, 0xdd, 0x69, 0x76, 0x28, 0xb9, 0x1d, 0x8f, 0x24, 0x55, 0x87, 0xee, 0x95, 0xc5,
      0xb0, 0x4d, 0x48, 0x96, 0x3f, 0x79, 0x25, 0x98, 0x77, 0xb4, 0x9c, 0xd9, 0x06, 0x3a, 0xea,
      0xd3, 0xb7,
    ]),
    "<~NXOZWFssmAO!I_\\mZkbq9h:R7GpSi%[%,eR3pP2'~>",
  ],
  [Buffer.from([6, 27, 178, 0, 0]), '<~"rjiJ!!~>'],
];

describe("base85 (ascii85)", () => {
  it.each(cases)("encodes #%#", (raw, encoded) => {
    expect(fileToBase85(raw)).toBe(encoded);
  });

  it.each(cases)("decodes #%#", (raw, encoded) => {
    expect(base85ToFile(encoded)).toStrictEqual(raw);
  });

  it.each(["<~u~>", "<~uuuuu~>"])("rejects invalid input %j", (encoded) => {
    expect(base85ToFile(encoded)).toBe(false);
  });

  it.each([
    "<~\n@p\ns7\ntD.3~>",
    "<~\n @  p \ns7 \n t D .3~>",
    "<~\n @  p \ns7 \n t D .3            ~>",
    "<~@ps7tD.3        \n    ~>",
    "<~       @ps7tD.3     \n     ~>",
  ])("ignores whitespace #%#", (encoded) => {
    expect(base85ToFile(encoded)).toStrictEqual(Buffer.from("canumb"));
  });

  it("encodes/decodes loremipsum", () => {
    const raw = fixture("loremipsum.raw");
    const encoded = fixture("loremipsum.base85").toString("ascii");

    expect(fileToBase85(raw)).toBe(encoded);
    expect(base85ToFile(encoded)).toStrictEqual(raw);
  });

  it("round-trips utf8 json", () => {
    const json = fixture("utf8.json");

    expect(base85ToFile(fileToBase85(json))).toStrictEqual(json);
  });
});
