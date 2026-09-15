import { describe, expect, it } from "vitest";

import type { ClassTarget, MethodTarget } from "./targets";

import { TARGETS } from "./targets";

/**
 * The target table names classes and methods as strings, so a rename in an SDK
 * package would silently stop producing spans. This resolves every entry
 * against the real modules so drift fails the build instead.
 */

const unresolved = (namespace: Record<string, unknown>, classes: ClassTarget[]): string[] => {
  const problems: string[] = [];

  const probe = (owner: unknown, members: (string | MethodTarget)[], label: string): void => {
    for (const member of members) {
      const name = typeof member === "string" ? member : member.name;
      if (typeof (owner as Record<string, unknown> | null)?.[name] !== "function") {
        problems.push(`${label}${name}`);
      }
    }
  };

  for (const klass of classes) {
    const ctor = namespace[klass.className] as { prototype?: unknown } | undefined;
    if (typeof ctor !== "function") {
      problems.push(klass.className);
      continue;
    }
    probe(ctor.prototype, klass.methods, `${klass.className}.`);
    probe(ctor, klass.staticMethods ?? [], `${klass.className}.`);
  }

  return problems;
};

describe("TARGETS", () => {
  for (const target of TARGETS) {
    it(`resolves every target in ${target.name}`, async () => {
      const namespace = (await import(target.name)) as Record<string, unknown>;
      expect(unresolved(namespace, target.classes)).toEqual([]);
    });
  }

  // Every method has to sit on a prototype or constructor for the no-loader-hook
  // path to reach it; a bare function export would need `import-in-the-middle`.
  it("has no bare function exports as targets", () => {
    expect(TARGETS.every((t) => t.classes.length > 0)).toBe(true);
  });
});
