import type { BaseLevel, Addon } from "../../../utils";
import type { PublicNotes } from "../../types";
import type { StructuredObject } from "./schema";

export function deriveLevel(credential: Partial<StructuredObject>): string {
  let level: BaseLevel = "basic";

  // Address is a sign for plus+
  const address = credential.residentialAddress;
  if (
    address?.proofFile &&
    address?.city &&
    address?.proofCategory &&
    address?.verified &&
    address?.country
  ) {
    level = "plus";
  }

  const addons: Addon[] = [];
  if (credential.biometric?.selfieFile) {
    addons.push("liveness");
  }

  if (credential.contact?.email) {
    addons.push("email");
  }

  if (credential.contact?.phoneNumber) {
    addons.push("phoneNumber");
  }

  if (credential.edd) {
    addons.push("edd");
  }

  if (credential.sourceOfWealth) {
    addons.push("sow");
  }

  if (credential.screening) {
    addons.push("screening");
  }

  if (credential.onboarding) {
    addons.push("onboarding");
  }

  return [level, ...addons].join("+");
}

export function deriveKYCLevel(credential: Partial<StructuredObject>): number {
  let kycLevel = 0;

  // basic+liveness are always at least kycLevel = 1
  if (credential.biometric && credential.person && credential.idDocument) {
    kycLevel = 1;
  }

  // plus+liveness are always at least kycLevel = 2
  if (
    kycLevel >= 1 &&
    credential.residentialAddress?.proofFile &&
    credential.residentialAddress?.verified
  ) {
    kycLevel = 2;
  }

  // full SOW and onboarding questionnaire are always at least kycLevel = 3
  if (kycLevel >= 2 && credential.sourceOfWealth && credential.onboarding) {
    kycLevel = 3;
  }

  return kycLevel;
}

export function derivePublicNotes(credential: Partial<StructuredObject>): PublicNotes {
  // Fetch POA metadata from the credential
  const proofOfResidency =
    credential.residentialAddress?.proofCategory && credential.residentialAddress?.verified
      ? {
          category: credential.residentialAddress?.proofCategory,
          dateOfIssue: credential.residentialAddress?.proofDateOfIssue,
        }
      : undefined;

  // Fetch POI metadata from the credential
  const proofOfIdentity = credential.idDocument?.type
    ? {
        type: credential.idDocument?.type,
        dateOfExpiry: credential.idDocument?.dateOfExpiry,
      }
    : undefined;

  return {
    type: "kyc",
    level: deriveLevel(credential),
    kycLevel: deriveKYCLevel(credential),

    /* Metadata from the credential */
    proofOfResidency,
    proofOfIdentity,
  };
}

export function deriveExpirationDate(credential: Partial<StructuredObject>): string | undefined {
  return credential.idDocument?.dateOfExpiry?.toISOString() ?? undefined;
}
