import { describe, expect, it } from "vitest";

import { base85ToFile, convertBuilderObject, convertValues, fileToBase85 } from "./serialization";

describe("file serialization", () => {
  it("round-trips files through base85", () => {
    const serialized = fileToBase85(Buffer.from("document"));

    expect(base85ToFile(serialized)?.toString()).toBe("document");
  });
});

describe("convertValues", () => {
  it("serializes flat values with an optional prefix", () => {
    const result = convertValues(
      {
        firstName: "Ada",
        issued: new Date("2024-01-01T00:00:00.000Z"),
        documentFile: Buffer.from("document"),
      },
      "person",
    );

    expect(result).toEqual({
      personFirstName: "Ada",
      personIssued: "2024-01-01T00:00:00.000Z",
      personDocumentFile: fileToBase85(Buffer.from("document")),
    });
  });
});

describe("convertBuilderObject", () => {
  it("flattens root and prefixed sections", () => {
    const result = convertBuilderObject({
      root: {
        id: "subject-123",
      },
      person: {
        firstName: "Ada",
        dateOfBirth: new Date("1815-12-10T00:00:00.000Z"),
        portraitFile: Buffer.from("portrait"),
      },
    });

    expect(result).toEqual({
      id: "subject-123",
      personFirstName: "Ada",
      personDateOfBirth: "1815-12-10T00:00:00.000Z",
      personPortraitFile: fileToBase85(Buffer.from("portrait")),
    });
  });
});
