#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(dirname, "..");

/*
 * The schemas are imported as TypeScript and reflected over at runtime: node strips the
 * types itself, so the only gap is that it won't guess the extension of `../../codecs`.
 * Only rewrite specifiers coming from a `.ts` file — dependencies such as `base85` do
 * their own extensionless CommonJS requires and must be left alone.
 */
registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith(".") &&
      !path.extname(specifier) &&
      context.parentURL?.endsWith(".ts")
    ) {
      return next(`${specifier}.ts`, context);
    }

    return next(specifier, context);
  },
});

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

function unwrapOptional(schema) {
  return schema?._def?.type === "optional" ? schema._def.innerType : schema;
}

/**
 * A codec (`z.codec`) is a pipe from the wire type to the decoded one. The JSON-LD
 * context describes the *decoded* meaning of a field — a base85 file is still a
 * string, but an ISO date must stay `xsd:date` — so resolve to the output side.
 */
function unwrapCodec(schema) {
  return schema?._def?.type === "pipe" && schema._def.out ? schema._def.out : schema;
}

function resolveSchema(schema) {
  return unwrapCodec(unwrapOptional(schema));
}

function getContextType(schema) {
  const type = resolveSchema(schema)?._def?.type;
  const format = resolveSchema(schema)?._def?.format;
  const isInt = resolveSchema(schema)?.isInt;

  if (type === "date") {
    return "xsd:date";
  }

  if (type === "boolean") {
    return "xsd:boolean";
  }

  if (type === "number") {
    if (isInt) {
      return "xsd:integer";
    }

    return "xsd:double";
  }

  if (format === "datetime") {
    return "xsd:dateTime";
  }

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

// Configuration & directory paths
const configuration = [
  {
    dir: "envelope/v1",
    jsonLd: "idos-credentials-v1",
    noRoot: true,
  },
  {
    dir: "envelope/v2",
    jsonLd: "idos-credentials-v2",
    noRoot: true,
  },
  {
    dir: "Kyc/v3",
    jsonLd: "idos-credential-subject-v3",
  },
  {
    dir: "Kyc/v1",
    jsonLd: "idos-credential-subject-v1",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  {
    dir: "Kyc/v2",
    jsonLd: "idos-credential-subject-v2",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  {
    dir: "FaceId/v1",
    jsonLd: "idos-credential-subject-face-id-v1",
  },
  {
    dir: "Edd/v1",
    jsonLd: "idos-credential-subject-edd-v1",
  },
];

function renderJsonLd(schemaShape, { extraContext = {}, fieldContextOverrides = {} }) {
  const context = {
    "@version": 1.1,
    "@protected": true,
    xsd: "http://www.w3.org/2001/XMLSchema#",
    ...extraContext,
  };

  // We need those fields to be part of ZOD validations
  // but JSON-LD already defines them
  const skipRootFields = ["id", "issued", "expirationDate"];

  for (const [prefix, schema] of Object.entries(schemaShape)) {
    let currentSchema = schema;
    if (currentSchema._def?.type === "optional") {
      currentSchema = currentSchema.unwrap();
    }

    for (const [fieldName, fieldSchema] of Object.entries(currentSchema.shape)) {
      const verifiableFieldName =
        prefix === "root" ? fieldName : `${prefix}${capitalize(fieldName)}`;
      const fieldContextOverride = fieldContextOverrides[verifiableFieldName];

      if (fieldContextOverride === null) {
        continue;
      }

      if (prefix === "root") {
        if (!skipRootFields.includes(fieldName)) {
          // root.id is required, but it's already part of the JSON-LD schema
          context[fieldName] = fieldContextOverride ?? getContextType(fieldSchema);
        }
      } else {
        context[verifiableFieldName] = fieldContextOverride ?? getContextType(fieldSchema);
      }
    }
  }

  return `${JSON.stringify({ "@context": context }, null, 2)}\n`;
}

async function main() {
  const schemaRoot = path.join(packageRoot, "src/schemas");
  const jsonLdRoot = path.join(packageRoot, "assets");

  for (const { dir, jsonLd, noRoot, extraContext, fieldContextOverrides } of configuration) {
    const { StructuredSchema } = await import(
      pathToFileURL(path.join(schemaRoot, dir, "schema.ts")).href
    );

    // Generate JSON-LD schema
    const jsonLdFile = path.join(jsonLdRoot, `${jsonLd}.json`);
    fs.rmSync(jsonLdFile, { force: true });

    // Convert noRoot schema to root schema
    let schema = StructuredSchema;
    if (noRoot) {
      schema = z.object({
        root: StructuredSchema,
      });
    }

    fs.writeFileSync(
      jsonLdFile,
      renderJsonLd(schema.shape, { extraContext, fieldContextOverrides }),
    );
  }

  formatFilesInDirectory("assets/*.json");
}

await main();
