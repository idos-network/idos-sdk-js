// cspell:disable -- names in other scripts
import { describe, expect, it, vi } from "vitest";

import { registerTransliteration, transliterateIcao, transliterateLatin } from "./transliterate";

describe("transliterateIcao", () => {
  it.each([
    ["John", "John"],
    ["Müller", "Mueller"],
    ["MÜLLER", "MUELLER"],
    ["Straße", "Strasse"],
    ["Øyvind Åsen", "Oeyvind Aasen"],
    ["Dvořák", "Dvorak"],
    ["Łukasz", "Lukasz"],
    ["Жанна", "Zhanna"],
    ["ЖАННА", "ZHANNA"],
    ["Щукин", "Shchukin"],
    ["Юлия Ильинична", "Iuliia Ilinichna"],
    ["Объедков", "Obieedkov"],
    ["Ђорђе Јовановић", "Dorde Jovanovic"],
    ["O'Brien-Smith", "O'Brien-Smith"],
    // Decomposed input lands on the same table entry as precomposed.
    ["Mu\u0308ller", "Mueller"],
  ])("%s -> %s", (input, output) => {
    expect(transliterateIcao(input)).toBe(output);
  });

  it("returns undefined for a script it has no table for", () => {
    expect(transliterateIcao("Αλέξανδρος")).toBeUndefined();
    expect(transliterateIcao("王伟")).toBeUndefined();
  });
});

describe("transliterateLatin", () => {
  it("says how to register the library until an app does", async () => {
    // A fresh copy of the module, so a registration elsewhere cannot leak in.
    vi.resetModules();
    const fresh = await import("./transliterate");

    await expect(fresh.transliterateLatin("Юлия")).rejects.toThrow(
      /registerTransliteration\(\(\) => import\("transliteration"\)\)/,
    );
  });

  it("leaves an unawaited <field>Latin read without an unhandled rejection", async () => {
    vi.resetModules();
    const { Transliterate } = await import("../schemas/utils");
    const proto = {};
    Transliterate()(proto, "name");
    const person = Object.assign(Object.create(proto), { name: "Юлия" });
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    void person.nameLatin;
    await new Promise((resolve) => setTimeout(resolve, 10));
    process.off("unhandledRejection", unhandled);

    expect(unhandled).not.toHaveBeenCalled();
    await expect(person.nameLatin).rejects.toThrow(/registerTransliteration/);
  });

  it("covers scripts the ICAO tables do not once registered", async () => {
    registerTransliteration(() => import("transliteration"));

    expect(await transliterateLatin("Юлия")).toBe("Yuliya");
    expect(await transliterateLatin("Αλέξανδρος")).toBe("Alexandros");
  });
});
