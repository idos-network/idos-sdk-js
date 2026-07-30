import { describe, expect, it } from "vitest";

import { convertBuilderObject, convertValues } from "./serialization";

/*
 * Values reach these helpers already encoded — the schemas declare their wire form with a
 * codec and the container runs `z.encode` first — so flattening must be a pure rename and
 * must leave the values it carries untouched.
 */
describe("convertValues", () => {
  it("prefixes keys without touching values", () => {
    const result = convertValues(
      {
        firstName: "Ada",
        issued: "2024-01-01T00:00:00.000Z",
        documentFile: "<~;KZGo~>",
      },
      "person",
    );

    expect(result).toEqual({
      personFirstName: "Ada",
      personIssued: "2024-01-01T00:00:00.000Z",
      personDocumentFile: "<~;KZGo~>",
    });
  });

  it("leaves keys unprefixed when no prefix is given", () => {
    expect(convertValues({ id: "subject-123" })).toEqual({ id: "subject-123" });
  });
});

describe("convertBuilderObject", () => {
  it("flattens root unprefixed and every other section prefixed", () => {
    const result = convertBuilderObject({
      root: {
        id: "subject-123",
      },
      person: {
        firstName: "Ada",
        dateOfBirth: "1815-12-10T00:00:00.000Z",
        portraitFile: "<~;KZGo~>",
      },
    });

    expect(result).toEqual({
      id: "subject-123",
      personFirstName: "Ada",
      personDateOfBirth: "1815-12-10T00:00:00.000Z",
      personPortraitFile: "<~;KZGo~>",
    });
  });
});
