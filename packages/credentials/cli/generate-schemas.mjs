#!/usr/bin/env node

/*
 * Reflects over the built credential classes to regenerate the JSON-LD contexts in `assets/`.
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
 * Reflection over the classes. A field's declared TypeScript type comes from
 * `emitDecoratorMetadata`; its validators name the finer distinctions that type erases, such as
 * an integer from a float.
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
 * date only ever a day. Both hold a `Date`, so the type alone cannot tell them apart.
 */
function contextTypeOf(cls, property, dateType) {
  const type = Reflect.getMetadata("design:type", cls.prototype, property)?.name;

  if (type === "Boolean") return "xsd:boolean";
  if (type === "Date") return dateType;

  if (type === "Number") {
    return validatorsOf(cls, property).includes("isInt") ? "xsd:integer" : "xsd:double";
  }

  // Files cross the wire as ascii85, so a Buffer is a string here too.
  return "xsd:string";
}

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
 * One entry per generated context. `envelope` names the envelope class to reflect over; the
 * others name a credential version, whose subject class is read from an instance.
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
    version: "KycV3",
    jsonLd: "idos-credential-subject-v3",
  },
  {
    version: "KycV1",
    jsonLd: "idos-credential-subject-v1",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  {
    version: "KycV2",
    jsonLd: "idos-credential-subject-v2",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  {
    version: "FaceIdV1",
    jsonLd: "idos-credential-subject-face-id-v1",
  },
  {
    version: "EddV1",
    jsonLd: "idos-credential-subject-edd-v1",
  },
];

function renderJsonLd(cls, { dateType, extraContext = {}, fieldContextOverrides = {} }) {
  const context = {
    "@version": 1.1,
    "@protected": true,
    xsd: "http://www.w3.org/2001/XMLSchema#",
    ...extraContext,
  };

  /*
   * Fields JSON-LD already defines. They stay on the classes because a credential still has to
   * carry and validate them.
   */
  const definedByJsonLd = ["id", "issued", "expirationDate"];
  const sections = sectionsOf(cls);

  /** Records one flattened field, unless an override suppresses it with `null`. */
  const put = (field, owner, ownerField) => {
    const override = fieldContextOverrides[field];

    if (override === null) return;

    context[field] = override ?? contextTypeOf(owner, ownerField, dateType);
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

async function main() {
  const schemaModule = path.join(packageRoot, "dist/schemas/index.mjs");
  const jsonLdRoot = path.join(packageRoot, "assets");

  if (!fs.existsSync(schemaModule)) {
    throw new Error("No dist/schemas: run `pnpm build` first.");
  }

  const schemas = await import(pathToFileURL(schemaModule).href);

  for (const {
    version,
    envelope,
    jsonLd,
    dateType,
    extraContext,
    fieldContextOverrides,
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
      }),
    );
  }

  formatFilesInDirectory("assets/*.json");
}

await main();
