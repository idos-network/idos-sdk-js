#!/usr/bin/env node

/*
 * Reflects over the built credential classes to regenerate the JSON-LD contexts in `assets/`,
 * and the vocabulary document their per-field IRIs belong to.
 * Reads `dist/`, so run `pnpm build` first — `pnpm build && pnpm generate:schemas`.
 */

import "reflect-metadata";
import { getMetadataStorage } from "class-validator";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(dirname, "..");

// Utility functions
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFilesInDirectory(directory) {
  const result = spawnSync(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "oxfmt", directory],
    { cwd: packageRoot, stdio: "inherit" },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Failed to format ${path.relative(packageRoot, directory)}`);
  }
}

/*
 * Reflection over the classes, by way of their validators: the package builds without
 * `emitDecoratorMetadata` (see tsconfig.json), so `design:type` is not in `dist/`. The
 * validators carry it anyway, along with the finer distinctions a TypeScript type erases, such
 * as an integer from a float.
 */

const storage = getMetadataStorage();

/** The validator names on one property, e.g. `["isInt", "isPositive"]`. */
function validatorsOf(cls, property) {
  return storage
    .getTargetValidationMetadatas(cls, cls.name, true, false)
    .filter((entry) => entry.propertyName === property)
    .flatMap((entry) =>
      entry.constraintCls
        ? storage.getTargetValidatorConstraints(entry.constraintCls).map(({ name }) => name)
        : [entry.type],
    );
}

/**
 * The fields of a class in declaration order: an instance's own keys, which is the order the
 * class body assigns them, a subclass's inherited fields first. `getTargetValidationMetadatas`
 * cannot be used for this — it returns a subclass's own fields ahead of the inherited ones.
 */
function fieldsOf(cls) {
  return Object.keys(new cls());
}

/**
 * The sections a class declares, keyed by property. `Section` records them under a symbol, found
 * by name rather than by importing the symbol from the built bundle.
 */
function sectionsOf(cls) {
  const key = Reflect.getMetadataKeys(cls).find(
    (entry) => String(entry) === "Symbol(idos:sections)",
  );

  return new Map((key ? (Reflect.getMetadata(key, cls) ?? []) : []).map((s) => [s.property, s]));
}

/*
 * `dateType` differs per credential half: an envelope date carries a full timestamp, a subject
 * date only ever a day. Both validate as `isDate`, so the field alone cannot tell them apart.
 */
function contextTypeOf(cls, property, dateType) {
  const validators = validatorsOf(cls, property);

  if (validators.includes("isBoolean")) return "xsd:boolean";
  if (validators.includes("isDate")) return dateType;
  if (validators.includes("isInt")) return "xsd:integer";
  if (validators.includes("isNumber")) return "xsd:double";

  // Anything else crosses the wire as a string, a file included: those are ascii85.
  return "xsd:string";
}

/*
 * The namespace of every term in a context generated with `perFieldIri`: each field becomes
 * `<IDOS_VOCAB><field>`. This IRI ends up in signed credentials, so never change it. It does
 * not have to resolve.
 */
const IDOS_VOCAB = "https://vocab.idos.network/credentials#";

/** The vocabulary itself: the IRI its terms are defined by, and the document that lists them. */
const IDOS_VOCAB_ONTOLOGY = IDOS_VOCAB.slice(0, -1);
const IDOS_VOCAB_FILE = "idos-vocab.xml";

const XSD = "http://www.w3.org/2001/XMLSchema#";

const legacyCountryCodesContext =
  "https://raw.githubusercontent.com/idos-network/idos-sdk-js/168f449a799620123bc7b01fc224423739500f94/packages/issuer-sdk-js/assets/country-codes.xml";

const legacyKycFieldContextOverrides = {
  nationality: "aux:ISO_3166-1_alpha-2",
  dateOfBirth: "aux:date",
  idDocumentDateOfIssue: "aux:date",
  idDocumentDateOfExpiry: "aux:date",
  residentialAddressCountry: "aux:ISO_3166-1_alpha-2",
};

/*
 * One entry per generated context. Both `envelope` and `version` name an export of
 * `dist/schemas`: an envelope class is reflected over directly, a credential version has its
 * subject class read from an instance.
 *
 * `dateType` is per context rather than derived: a `Date` field says nothing about whether the
 * wire form carries a timestamp, and these contexts are published — v1 declared its `approvedAt`
 * an `xsd:date` and has to keep saying so.
 */
const configuration = [
  {
    envelope: "EnvelopeV1",
    jsonLd: "idos-credentials-v1",
    dateType: "xsd:date",
  },
  {
    envelope: "EnvelopeV2",
    jsonLd: "idos-credentials-v2",
    dateType: "xsd:dateTime",
  },
  {
    version: "VerifiableCredentialKycV3",
    jsonLd: "idos-credential-subject-v3",
  },
  {
    version: "VerifiableCredentialKycV1",
    jsonLd: "idos-credential-subject-v1",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  {
    version: "VerifiableCredentialKycV2",
    jsonLd: "idos-credential-subject-v2",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  /*
   * v4 and EDD v2 give every field an explicit IRI in the idOS vocabulary. The contexts above
   * are signed into issued credentials and stay as they are.
   */
  {
    version: "VerifiableCredentialKycV4",
    jsonLd: "idos-credential-subject-v4",
    // A subject date crosses the wire as a full ISO timestamp (`toISOString()`).
    dateType: "xsd:dateTime",
    perFieldIri: true,
  },
  {
    version: "VerifiableCredentialEddV2",
    jsonLd: "idos-credential-subject-edd-v2",
    perFieldIri: true,
  },
  {
    version: "VerifiableCredentialFaceIdV1",
    jsonLd: "idos-credential-subject-face-id-v1",
  },
  {
    version: "VerifiableCredentialEddV1",
    jsonLd: "idos-credential-subject-edd-v1",
  },
];

/**
 * Renders one context. With `perFieldIri`, each field's IRI and type also go into `vocabulary`
 * (IRI → `xsd:` type), which every such context shares.
 */
function renderJsonLd(
  cls,
  { dateType, extraContext = {}, fieldContextOverrides = {}, perFieldIri = false, vocabulary },
) {
  const context = {
    "@version": 1.1,
    "@protected": true,
    xsd: XSD,
    ...extraContext,
  };

  /*
   * Fields JSON-LD already defines. They stay on the classes because a credential still has to
   * carry and validate them.
   */
  const definedByJsonLd = ["id", "issued", "expirationDate"];
  const sections = sectionsOf(cls);
  const ids = new Set();

  /** Records one flattened field, unless an override suppresses it with `null`. */
  const put = (field, owner, ownerField) => {
    const override = fieldContextOverrides[field];

    if (override === null) return;

    const type = override ?? contextTypeOf(owner, ownerField, dateType);

    if (!perFieldIri) {
      context[field] = type;
      return;
    }

    const id = `${IDOS_VOCAB}${field}`;

    if (ids.has(id)) throw new Error(`Two fields expand to ${id}`);
    ids.add(id);

    // Contexts share the vocabulary, so a term has one type wherever it appears.
    const known = vocabulary.get(id);
    if (known && known !== type)
      throw new Error(`${id} is ${known} in one context, ${type} in another`);
    vocabulary.set(id, type);

    context[field] = { "@id": id, "@type": type };
  };

  for (const field of fieldsOf(cls)) {
    const section = sections.get(field);

    if (!section) {
      if (!definedByJsonLd.includes(field)) put(field, cls, field);
      continue;
    }

    const sectionClass = section.type();

    for (const sectionField of fieldsOf(sectionClass)) {
      const prefixed = section.prefix
        ? `${section.prefix}${capitalize(sectionField)}`
        : sectionField;

      put(prefixed, sectionClass, sectionField);
    }
  }

  return `${JSON.stringify({ "@context": context }, null, 2)}\n`;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * The vocabulary as RDF/XML: one `rdf:Property` per term, with its datatype as `rdfs:range`.
 * Published next to the contexts; nothing loads it to verify a credential.
 */
function renderVocabulary(vocabulary) {
  const properties = [...vocabulary].map(([id, type]) => {
    const range = type.startsWith("xsd:") ? `${XSD}${type.slice(4)}` : type;

    return [
      `  <rdf:Property rdf:about="${escapeXml(id)}">`,
      `    <rdfs:label>${escapeXml(id.slice(IDOS_VOCAB.length))}</rdfs:label>`,
      `    <rdfs:range rdf:resource="${escapeXml(range)}"/>`,
      `    <rdfs:isDefinedBy rdf:resource="${IDOS_VOCAB_ONTOLOGY}"/>`,
      "  </rdf:Property>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!-- Generated by cli/generate-schemas.mjs from the credential classes. Do not edit. -->",
    "<rdf:RDF",
    '  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
    '  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"',
    '  xmlns:owl="http://www.w3.org/2002/07/owl#">',
    `  <owl:Ontology rdf:about="${IDOS_VOCAB_ONTOLOGY}">`,
    "    <rdfs:label>idOS credential vocabulary</rdfs:label>",
    "    <rdfs:comment>Terms of the idOS credential subject contexts that give every field its own IRI.</rdfs:comment>",
    "  </owl:Ontology>",
    ...properties,
    "</rdf:RDF>",
    "",
  ].join("\n");
}

async function main() {
  const schemaModule = path.join(packageRoot, "dist/schemas/index.mjs");
  const jsonLdRoot = path.join(packageRoot, "assets");

  if (!fs.existsSync(schemaModule)) {
    throw new Error("No dist/schemas: run `pnpm build` first.");
  }

  const schemas = await import(pathToFileURL(schemaModule).href);
  const vocabulary = new Map();

  for (const {
    version,
    envelope,
    jsonLd,
    dateType,
    extraContext,
    fieldContextOverrides,
    perFieldIri,
  } of configuration) {
    const exported = schemas[envelope ?? version];

    if (!exported) throw new Error(`dist/schemas does not export ${envelope ?? version}`);

    /*
     * An envelope is reflected over directly; a version keeps its subject class in a private
     * field, which is private only to TypeScript — at runtime it is an ordinary property.
     */
    const cls = envelope ? exported : new exported().subjectClass;

    if (typeof cls !== "function") {
      throw new Error(`${version}: expected a subject class, got ${typeof cls}`);
    }

    const jsonLdFile = path.join(jsonLdRoot, `${jsonLd}.json`);
    fs.rmSync(jsonLdFile, { force: true });

    fs.writeFileSync(
      jsonLdFile,
      renderJsonLd(cls, {
        // A subject date is only ever a day; an envelope names its own type above.
        dateType: dateType ?? "xsd:date",
        extraContext,
        fieldContextOverrides,
        perFieldIri,
        vocabulary,
      }),
    );
  }

  fs.writeFileSync(path.join(jsonLdRoot, IDOS_VOCAB_FILE), renderVocabulary(vocabulary));

  formatFilesInDirectory("assets/*.json");
}

await main();
