import { describe, expect, it } from "vitest";
import { deriveLevel } from "./utils";
import type { CredentialSubject } from "./utils/types";

const defaultCredential: CredentialSubject = {
  id: "uuid:1234",
  firstName: "John",
  familyName: "Doe",
  idDocumentType: "PASSPORT",
  dateOfBirth: new Date("1990-01-01"),
  idDocumentCountry: "US",
  idDocumentNumber: "123456789",
  idDocumentFrontFile: Buffer.from("ID Document Front"),
  selfieFile: Buffer.alloc(0),
};

describe("deriveLevel", () => {
  it("basic only", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        selfieFile: undefined,
      }),
    ).toBe("basic");
  });

  it("basic+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
      }),
    ).toBe("basic+liveness");
  });

  it("plus+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        residentialAddress: {
          street: "123 Main St",
          city: "Anytown",
          postalCode: "12345",
          country: "US",
          proofCategory: "UTILITY_BILL",
          proofFile: Buffer.from("Utility Bill"),
        },
      }),
    ).toBe("plus+liveness");
  });

  it("plus+liveness+phoneNumber", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        selfieFile: Buffer.from("Selfie"),
        phoneNumber: "+1234567890",
        email: "john.doe@example.com",
        residentialAddress: {
          street: "123 Main St",
          city: "Anytown",
          postalCode: "12345",
          country: "US",
          proofCategory: "UTILITY_BILL",
          proofFile: Buffer.from("Utility Bill"),
        },
      }),
    ).toBe("plus+liveness+email+phoneNumber");
  });
});
