// cspell:ignore selfcheck
/**
 *   node --experimental-strip-types apps/idos-data-dashboard/src/lib/rfc3339.selfcheck.ts
 */
import assert from "node:assert/strict";
import { z } from "zod";

import { toSecondPrecisionIso } from "./rfc3339.ts";

const secondPrecision = z.iso.datetime({ precision: 0 });
const withMilliseconds = new Date("2026-10-02T11:20:27.992Z").toISOString();

assert.equal(secondPrecision.safeParse(withMilliseconds).success, false);
assert.equal(toSecondPrecisionIso(new Date("2026-10-02T11:20:27.992Z")), "2026-10-02T11:20:27Z");
assert.equal(
  secondPrecision.safeParse(toSecondPrecisionIso(new Date("2026-10-02T11:20:27.992Z"))).success,
  true,
);
