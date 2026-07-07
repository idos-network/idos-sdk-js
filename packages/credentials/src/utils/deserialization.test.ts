import { fileToBase85 } from "@idos-network/utils/codecs";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { flatObjectToStructured, flatSubjectToStructured } from "./deserialization";

describe("flatObjectToStructured", () => {
  it("deserializes flat values according to the provided schema", () => {
    const schema = z.object({
      id: z.string(),
      issued: z.date(),
      approvalFile: z.instanceof(Buffer).optional(),
      reviewStatus: z.enum(["pending", "approved", "rejected"]),
      status: z.string().default("approved"),
    });

    const result = flatObjectToStructured(
      {
        id: "credential-123",
        issued: "2024-01-01T00:00:00.000Z",
        approvalFile: fileToBase85(Buffer.from("approval")),
        reviewStatus: "pending",
        ignored: "extra field",
      },
      schema,
    );

    expect(result).toEqual({
      id: "credential-123",
      issued: new Date("2024-01-01T00:00:00.000Z"),
      approvalFile: Buffer.from("approval"),
      reviewStatus: "pending",
      status: "approved",
    });
  });

  it("fails when a flat enum value does not match the schema", () => {
    const schema = z.object({
      id: z.string(),
      reviewStatus: z.enum(["pending", "approved", "rejected"]),
    });

    expect(() =>
      flatObjectToStructured(
        {
          id: "credential-123",
          reviewStatus: "unknown",
        },
        schema,
      ),
    ).toThrow(z.ZodError);
  });
});

describe("flatSubjectToStructured", () => {
  it("deserializes root and prefixed subject sections according to the provided schema", () => {
    const schema = z.object({
      root: z.object({
        id: z.string(),
      }),
      person: z
        .object({
          firstName: z.string(),
          dateOfBirth: z.date(),
          documentType: z.enum(["PASSPORT", "ID_CARD"]),
          portraitFile: z.instanceof(Buffer).optional(),
        })
        .optional(),
      contact: z
        .object({
          email: z.string(),
        })
        .optional(),
    });

    const result = flatSubjectToStructured(
      {
        id: "subject-123",
        personFirstName: "Ada",
        personDateOfBirth: "1815-12-10T00:00:00.000Z",
        personDocumentType: "PASSPORT",
        personPortraitFile: fileToBase85(Buffer.from("portrait")),
        ignored: "extra field",
      },
      schema,
    );

    expect(result).toEqual({
      root: {
        id: "subject-123",
      },
      person: {
        firstName: "Ada",
        dateOfBirth: new Date("1815-12-10T00:00:00.000Z"),
        documentType: "PASSPORT",
        portraitFile: Buffer.from("portrait"),
      },
    });
  });

  it("fails when a prefixed enum value does not match the schema", () => {
    const schema = z.object({
      root: z.object({
        id: z.string(),
      }),
      person: z.object({
        documentType: z.enum(["PASSPORT", "ID_CARD"]),
      }),
    });

    expect(() =>
      flatSubjectToStructured(
        {
          id: "subject-123",
          personDocumentType: "DRIVER_LICENSE",
        },
        schema,
      ),
    ).toThrow(z.ZodError);
  });
});
