import { describe, expect, it } from "vitest";
import { deriveLevel } from "./utils";
import type { CredentialSubject } from "./utils/types";

const defaultCredential: CredentialSubject = {
  id: "uuid:1234",
  firstName: "John",
  familyName: "Doe",
  idDocumentType: "PASSPORT",
};

describe("deriveLevel", () => {
  it("basic only", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
      }),
    ).toBe("basic");
  });

  it("basic+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        selfieFile: Buffer.from("Selfie"),
      }),
    ).toBe("basic+liveness");
  });

  it("plus+liveness", () => {
    expect(
      deriveLevel({
        ...defaultCredential,
        selfieFile: Buffer.from("Selfie"),
        residentialAddress: {
          streetAddress: "123 Main St",
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
          streetAddress: "123 Main St",
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
