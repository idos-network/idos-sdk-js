import { describe, expect, it } from "vitest";

import type { PatchTarget } from "./targets";

import { TARGETS } from "./targets";

/**
 * The target table names classes and methods as strings, so a rename in an SDK
 * package would silently stop producing spans. This resolves every entry
 * against the real modules so drift fails the build instead.
 */

/** File targets are matched at runtime by built path; here they are imported by specifier. */
const SUBPATH_SPECIFIERS: Record<string, string> = {
  "dist/verifier/index.mjs": "@idos-network/credentials/verifier",
  "dist/local.mjs": "@idos-network/enclave/local",
};

const unresolved = (namespace: Record<string, unknown>, target: PatchTarget): string[] => {
  const problems: string[] = [];

  const probe = (owner: unknown, members: PatchTarget["functions"], label: string): void => {
    for (const member of members ?? []) {
      const name = typeof member === "string" ? member : member.name;
      if (typeof (owner as Record<string, unknown> | null)?.[name] !== "function") {
        problems.push(`${label}${name}`);
      }
    }
  };

  for (const klass of target.classes ?? []) {
    const ctor = namespace[klass.className] as { prototype?: unknown } | undefined;
    if (typeof ctor !== "function") {
      problems.push(klass.className);
      continue;
    }
    probe(ctor.prototype, klass.methods, `${klass.className}.`);
    probe(ctor, klass.staticMethods, `${klass.className}.`);
  }
  probe(namespace, target.functions, "");

  return problems;
};

describe("TARGETS", () => {
  for (const target of TARGETS) {
    if (target.classes || target.functions) {
      it(`resolves every target in ${target.name}`, async () => {
        const namespace = (await import(target.name)) as Record<string, unknown>;
        expect(unresolved(namespace, target)).toEqual([]);
      });
    }

    for (const file of target.files ?? []) {
      const specifier = SUBPATH_SPECIFIERS[file.path];

      it(`resolves every target in ${specifier ?? `${target.name}/${file.path}`}`, async () => {
        expect(specifier, `no test specifier mapped for ${file.path}`).toBeDefined();
        const namespace = (await import(specifier)) as Record<string, unknown>;
        expect(unresolved(namespace, file)).toEqual([]);
      });
    }
  }
});
