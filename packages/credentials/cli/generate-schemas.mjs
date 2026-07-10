#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(dirname, "..");
const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

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

function getContextType(schema) {
  const type = unwrapOptional(schema)?._def?.type;
  const format = unwrapOptional(schema)?._def?.format;
  const isInt = unwrapOptional(schema)?.isInt;

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

function getZodSchemaType(schema, sourceExpression) {
  const isOptional = schema?._def?.type === "optional";
  const type = unwrapOptional(schema)?._def?.type;
  const format = unwrapOptional(schema)?._def?.format;

  if (type === "custom" || type === "date" || format === "datetime") {
    return isOptional ? "z.ZodOptional<z.ZodString>" : "z.ZodString";
  }

  return `typeof ${sourceExpression}`;
}

function getZodType(schema, sourceExpression) {
  const isOptional = schema?._def?.type === "optional";
  const type = unwrapOptional(schema)?._def?.type;
  const format = unwrapOptional(schema)?._def?.format;

  if (type === "custom" || type === "date" || format === "datetime") {
    return isOptional ? "z.string().optional()" : "z.string()";
  }

  return sourceExpression;
}

function makeOptional(schema, expression) {
  return schema?._def?.type === "optional" ? expression : `${expression}.optional()`;
}

function makeOptionalSchemaType(schema, typeExpression) {
  return schema?._def?.type === "optional"
    ? typeExpression
    : `z.ZodOptional<${typeExpression}>`;
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
    flatName: false,
  },
  {
    dir: "envelope/v2",
    jsonLd: "idos-credentials-v2",
    noRoot: true,
    flatName: false,
  },
  {
    dir: "Kyc/v3",
    jsonLd: "idos-credential-subject-v3",
    flatName: "CredentialSubjectV3",
  },
  {
    dir: "Kyc/v1",
    jsonLd: "idos-credential-subject-v1",
    flatName: "CredentialSubjectV1",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  {
    dir: "Kyc/v2",
    jsonLd: "idos-credential-subject-v2",
    flatName: "CredentialSubjectV2",
    extraContext: {
      aux: legacyCountryCodesContext,
    },
    fieldContextOverrides: legacyKycFieldContextOverrides,
  },
  {
    dir: "FaceId/v1",
    jsonLd: "idos-credential-subject-face-id-v1",
    flatName: "FaceIdV1",
  },
];

function compileEntities(entitiesRoot, indexPath) {
  const tmpParent = path.join(packageRoot, ".tmp");
  fs.mkdirSync(tmpParent, { recursive: true });
  const tmpRoot = fs.mkdtempSync(path.join(tmpParent, "json-ld-"));
  fs.writeFileSync(path.join(tmpRoot, "package.json"), JSON.stringify({ type: "commonjs" }));

  const result = spawnSync(
    process.execPath,
    [
      tscPath,
      indexPath,
      "--outDir",
      tmpRoot,
      "--rootDir",
      entitiesRoot,
      "--target",
      "ES2022",
      "--module",
      "CommonJS",
      "--moduleResolution",
      "node10",
      "--skipLibCheck",
      "--esModuleInterop",
      "--noCheck",
    ],
    { cwd: packageRoot, stdio: "inherit" },
  );

  if (result.status !== 0) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    throw new Error("Failed to compile credential subject entities");
  }

  return tmpRoot;
}

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

function findSchemaExport(schema, tmpRoot, generatedTypesImportRoot) {
  for (const fileName of fs.readdirSync(tmpRoot)) {
    if (!fileName.endsWith(".js") || fileName === "index.js") {
      continue;
    }

    const exports = require(path.join(tmpRoot, fileName));
    for (const [exportName, exportedValue] of Object.entries(exports)) {
      if (exportedValue === schema) {
        return {
          exportName,
          importPath: `${generatedTypesImportRoot}/${fileName.replace(/\.js$/, "")}`,
        };
      }
    }
  }

  throw new Error("Unable to find source export for credential subject schema");
}

function getSchemaMetadata(credentialSubjectMapping, tmpRoot, generatedTypesImportRoot) {
  return Object.entries(credentialSubjectMapping).map(([prefix, schema]) => {
    const unwrappedSchema = unwrapOptional(schema);

    return {
      prefix,
      schema: unwrappedSchema,
      parentOptional: schema?._def?.type === "optional",
      ...findSchemaExport(unwrappedSchema, tmpRoot, generatedTypesImportRoot),
    };
  });
}

function renderSubjectTypes(options) {
  const { shape, typePrefix, tmpRoot, generatedTypesImportRoot } = options;
  const schemas = getSchemaMetadata(shape, tmpRoot, generatedTypesImportRoot);

  const imports = schemas
    .map(({ importPath, exportName }) => `import { ${exportName} } from "${importPath}";`)
    .join("\n");

  const fields = [];
  const typeDefinitions = [];

  for (const { prefix, schema, exportName, parentOptional } of schemas) {
    for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
      const verifiableFieldName =
        prefix === "root" ? fieldName : `${prefix}${capitalize(fieldName)}`;
      const sourceExpression = `${exportName}.shape.${fieldName}`;
      const zodType = getZodType(fieldSchema, sourceExpression);
      const zodSchemaType = getZodSchemaType(fieldSchema, sourceExpression);

      fields.push(
        `${verifiableFieldName}: ${
          parentOptional ? makeOptional(fieldSchema, zodType) : zodType
        },`,
      );
      typeDefinitions.push(
        `${verifiableFieldName}: ${
          parentOptional ? makeOptionalSchemaType(fieldSchema, zodSchemaType) : zodSchemaType
        },`,
      );
    }
  }

  return `/* This file is generated by packages/credentials/cli/generate-schemas.mjs. */
import { z } from "zod";

${imports}

export const ${typePrefix}Schema: z.ZodObject<{
${typeDefinitions.join("\n")}
}> = z.object({
${fields.join("\n")}
});

export type ${typePrefix} = z.infer<typeof ${typePrefix}Schema>;
`;
}

function main() {
  const schemaRoot = path.join(packageRoot, "src/schemas");
  const generatedRoot = path.join(packageRoot, "src/generated");
  const jsonLdRoot = path.join(packageRoot, "assets");

  fs.rmSync(generatedRoot, { recursive: true, force: true });
  fs.mkdirSync(generatedRoot, { recursive: true });

  for (const {
    dir,
    jsonLd,
    flatName,
    noRoot,
    extraContext,
    fieldContextOverrides,
  } of configuration) {
    const entitiesRoot = path.join(schemaRoot, dir);
    const entityIndexPath = path.join(entitiesRoot, "schema.ts");

    const tmpRoot = compileEntities(entitiesRoot, entityIndexPath);

    try {
      const { StructuredSchema } = require(path.join(tmpRoot, "schema.js"));

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

      if (flatName) {
        const flatFile = path.join(generatedRoot, `${flatName}.ts`);
        const generatedTypesImportRoot = `../schemas/${dir}`;

        fs.writeFileSync(
          flatFile,
          renderSubjectTypes({
            shape: schema.shape,
            typePrefix: flatName,
            tmpRoot,
            generatedTypesImportRoot,
            extraContext,
            fieldContextOverrides,
          }),
        );
      }
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  }

  formatFilesInDirectory("src/generated/*.ts");
  formatFilesInDirectory("assets/*.json");
}

main();
