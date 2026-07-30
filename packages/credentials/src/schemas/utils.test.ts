import { describe, expect, it } from "vitest";

import type { StructuredObject as EddV1Structured } from "./Edd/v1/schema";
import type { StructuredObject as FaceIdV1Structured } from "./FaceId/v1/schema";
import type { StructuredObject as KycV1Structured } from "./Kyc/v1/schema";
import type { StructuredObject as KycV2Structured } from "./Kyc/v2/schema";
import type { StructuredObject as KycV3Structured } from "./Kyc/v3/schema";
import type { FlatSubject } from "./utils";

/*
 * `FlatSubject` replaces the code-generated flat schemas that used to live in
 * `src/generated/`. These are compile-time assertions: `pnpm typecheck` fails if
 * the derivation drifts from the wire shape a subject is serialized to.
 *
 * `Exact` deliberately compares in BOTH directions, and optionality is asserted
 * separately, because mutual assignability alone does not distinguish
 * `a?: string` from `a: string | undefined` — which is precisely how a
 * non-homomorphic mapped type silently drops `?` modifiers.
 */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type OptionalKeys<T> = { [K in keyof T]-?: object extends Pick<T, K> ? K : never }[keyof T];
type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;

type IsOptional<T, K extends keyof T> = K extends OptionalKeys<T> ? true : false;
type IsRequired<T, K extends keyof T> = K extends RequiredKeys<T> ? true : false;

type KycV3Flat = FlatSubject<KycV3Structured>;

describe("FlatSubject", () => {
  it("keeps root fields unprefixed and prefixes every other section", () => {
    const root: Exact<KycV3Flat["id"], string> = true;
    const prefixed: Exact<KycV3Flat["personDateOfBirth"], string> = true;

    expect([root, prefixed]).toEqual([true, true]);
  });

  it("carries Date and Buffer as strings on the wire", () => {
    // person.dateOfBirth is z.date(); idDocument.frontFile is z.instanceof(Buffer).
    const date: Exact<KycV3Flat["personDateOfBirth"], string> = true;
    const buffer: Exact<KycV3Flat["idDocumentFrontFile"], string> = true;

    expect([date, buffer]).toEqual([true, true]);
  });

  it("keeps required fields of a required section required", () => {
    const dateOfBirth: IsRequired<KycV3Flat, "personDateOfBirth"> = true;
    const id: IsRequired<KycV3Flat, "id"> = true;

    expect([dateOfBirth, id]).toEqual([true, true]);
  });

  it("preserves optional fields of a required section", () => {
    const firstName: IsOptional<KycV3Flat, "personFirstName"> = true;

    expect(firstName).toBe(true);
  });

  it("makes required fields of an optional section optional", () => {
    // residentialAddress is optional, but `verified` and `street` are required within it,
    // so both must become optional once flattened.
    const verified: IsOptional<KycV3Flat, "residentialAddressVerified"> = true;
    const street: IsOptional<KycV3Flat, "residentialAddressStreet"> = true;

    expect([verified, street]).toEqual([true, true]);
  });

  it("derives a flat shape for every credential subject", () => {
    const kycV1: Exact<FlatSubject<KycV1Structured>["id"], string> = true;
    const kycV2: Exact<FlatSubject<KycV2Structured>["id"], string> = true;
    const kycV3: Exact<KycV3Flat["id"], string> = true;
    const faceId: Exact<FlatSubject<FaceIdV1Structured>["faceSignUserId"], string> = true;
    // edd.sourceOfFundsProofFile is an optional Buffer, so it lands as `string | undefined`.
    const edd: Exact<
      FlatSubject<EddV1Structured>["eddSourceOfFundsProofFile"],
      string | undefined
    > = true;

    expect([kycV1, kycV2, kycV3, faceId, edd]).toEqual([true, true, true, true, true]);
  });
});
