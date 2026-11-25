import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import published from "./published-contexts.json";

/*
 * Every context in `assets/` is published as is by `.github/workflows/static.yml`, and issued
 * credentials name it by URL, so a verifier that fetches it has to get the same definitions the
 * proof was made with. `published-contexts.json` freezes those definitions and the vocabulary
 * terms. They are append-only: a context may gain terms, but never lose or redefine one.
 *
 * Adding a term needs no change here. A new context file has to be added to the fixture. If a
 * definition has to change, add a new context version instead.
 */

const assets = new URL("../../assets/", import.meta.url);

type ContextBody = Record<string, unknown>;

function contextOf(file: string): ContextBody {
  return (JSON.parse(readFileSync(new URL(file, assets), "utf8")) as { "@context": ContextBody })[
    "@context"
  ];
}

/** The frozen entries the current value no longer has, or has with another definition. */
function brokenEntries(frozen: Record<string, unknown>, current: Record<string, unknown>) {
  return Object.keys(frozen).filter(
    (key) => !(key in current) || JSON.stringify(current[key]) !== JSON.stringify(frozen[key]),
  );
}

describe("published contexts", () => {
  it("freezes every context in assets", () => {
    const files = readdirSync(assets).filter((file) => file.endsWith(".json"));

    expect(Object.keys(published.contexts).sort()).toEqual(files.sort());
  });

  it.each(Object.entries(published.contexts))(
    "%s keeps every published definition",
    (file, frozen) => {
      expect(brokenEntries(frozen, contextOf(file))).toEqual([]);
    },
  );

  it("the vocabulary keeps every published term and range", () => {
    const xml = readFileSync(new URL("idos-vocab.xml", assets), "utf8");
    const current = Object.fromEntries(
      [
        ...xml.matchAll(
          /<rdf:Property rdf:about="([^"]+)">[\s\S]*?<rdfs:range rdf:resource="([^"]+)"\/>/g,
        ),
      ].map(([, id, range]) => [id, range]),
    );

    expect(brokenEntries(published.vocabulary, current)).toEqual([]);
  });
});
