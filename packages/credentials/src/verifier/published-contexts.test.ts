import { readdirSync, readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";

import published from "./published-contexts.json";

/*
 * Every context in `assets/` is published as is by `.github/workflows/static.yml`, and issued
 * credentials name it by URL, so a verifier that fetches it has to get the same definitions the
 * proof was made with. `published-contexts.json` records every published context and vocabulary
 * term, and the files must match it exactly.
 *
 * The record is append-only. A new term in a per-field-IRI context (KYC v4, EDD v2) is added to
 * the record in the same change. Never change or remove a recorded entry, including directives
 * such as `@protected` or `@language`: add a new context version instead. Contexts whose terms map
 * to datatypes (KYC v1–v3, EDD v1, the envelopes) are closed: don't add terms to them.
 */

const assets = new URL("../../assets/", import.meta.url);

type Entries = Record<string, unknown>;

function contextOf(file: string): Entries {
  return (JSON.parse(readFileSync(new URL(file, assets), "utf8")) as { "@context": Entries })[
    "@context"
  ];
}

function vocabulary(): Entries {
  const xml = readFileSync(new URL("idos-vocab.xml", assets), "utf8");
  return Object.fromEntries(
    [
      ...xml.matchAll(
        /<rdf:Property rdf:about="([^"]+)">[\s\S]*?<rdfs:range rdf:resource="([^"]+)"\/>/g,
      ),
    ].map(([, id, range]) => [id, range]),
  );
}

/** How `current` differs from the record: entries removed or changed, and entries not recorded. */
function differences(recorded: Entries, current: Entries) {
  return {
    removedOrChanged: Object.keys(recorded).filter(
      (key) => !(key in current) || !isDeepStrictEqual(current[key], recorded[key]),
    ),
    notRecorded: Object.keys(current).filter((key) => !(key in recorded)),
  };
}

const none = { removedOrChanged: [], notRecorded: [] };

describe("published contexts", () => {
  it("records every context in assets", () => {
    const files = readdirSync(assets).filter((file) => file.endsWith(".json"));

    expect(Object.keys(published.contexts).sort()).toEqual(files.sort());
  });

  it.each(Object.entries(published.contexts))("%s matches the record", (file, recorded) => {
    expect(differences(recorded, contextOf(file))).toEqual(none);
  });

  it("the vocabulary matches the record", () => {
    expect(differences(published.vocabulary, vocabulary())).toEqual(none);
  });

  /*
   * Envelope terms map to datatypes and share the credential node, so two terms of one datatype
   * would sign their values without their names. KYC v4 and EDD v2 still use the v2 envelope.
   */
  it.each(["idos-credentials-v1.json", "idos-credentials-v2.json"])(
    "%s gives each datatype at most one term",
    (file) => {
      const datatypes = Object.entries(contextOf(file))
        .filter(([term]) => !term.startsWith("@") && term !== "xsd")
        .map(([, definition]) => definition);

      expect(datatypes.length).toBe(new Set(datatypes).size);
    },
  );
});
