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

  it("covers scripts the ICAO tables do not once registered", async () => {
    registerTransliteration(() => import("transliteration"));

    expect(await transliterateLatin("Юлия")).toBe("Yuliya");
    expect(await transliterateLatin("Αλέξανδρος")).toBe("Alexandros");
  });
});
