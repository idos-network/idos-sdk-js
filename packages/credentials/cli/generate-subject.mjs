#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(dirname, "..");
const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

const entitiesRoot = path.join(packageRoot, "src/schemas/CredentialSubjectV3");
const entitiesIndexPath = path.join(entitiesRoot, "index.ts");

const jsonLdPath = path.join(packageRoot, "assets/idos-credential-subject-v3.json");
const subjectTypesPath = path.join(packageRoot, "src/types/credentialSubjectV3.generated.ts");

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function compileEntities() {
  const tmpParent = path.join(packageRoot, ".tmp");
  fs.mkdirSync(tmpParent, { recursive: true });
  const tmpRoot = fs.mkdtempSync(path.join(tmpParent, "json-ld-"));
  fs.writeFileSync(path.join(tmpRoot, "package.json"), JSON.stringify({ type: "commonjs" }));

  const result = spawnSync(
    process.execPath,
    [
      tscPath,
      entitiesIndexPath,
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

function unwrapOptional(schema) {
  return schema?._def?.type === "optional" ? schema._def.innerType : schema;
}

function getContextType(schema) {
  const type = unwrapOptional(schema)?._def?.type;

  if (type === "date") {
    return "xsd:date";
  }

  if (type === "boolean") {
    return "xsd:boolean";
  }

  if (type === "number") {
    return "xsd:double";
  }

  return "xsd:string";
}

function renderJsonLd(credentialSubjectMapping) {
  const context = {
    "@version": 1.1,
    "@protected": true,
    xsd: "http://www.w3.org/2001/XMLSchema#",
  };

  for (const [prefix, schema] of Object.entries(credentialSubjectMapping)) {
    for (const [fieldName, fieldSchema] of Object.entries(schema.shape)) {
      context[`${prefix}${capitalize(fieldName)}`] = getContextType(fieldSchema);
    }
  }

  return `${JSON.stringify({ "@context": context }, null, 2)}\n`;
}

function renderSubjectTypes(credentialSubjectMapping) {
  return `export const CredentialSubjectSchema: z.ZodObject<{
    ${Object.entries(credentialSubjectMapping)
      .map(([prefix, schema]) => `  ${prefix}: typeof ${prefix}Schema;`)
      .join("\n")}
    }> = z.object({${Object.entries(credentialSubjectMapping)})

  export type CredentialSubject = z.infer<typeof CredentialSubjectSchema>;
`;
}

function main() {
  const tmpRoot = compileEntities();

  try {
    const { default: mapping } = require(path.join(tmpRoot, "index.js"));

    fs.rmSync(jsonLdPath, { force: true });
    fs.rmSync(subjectTypesPath, { force: true });

    fs.writeFileSync(jsonLdPath, renderJsonLd(mapping));
    fs.writeFileSync(subjectTypesPath, renderSubjectTypes(mapping));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

main();
