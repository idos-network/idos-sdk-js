import type { BuilderType } from ".";
import type { BaseLevel, Addon } from "../../utils";

export function deriveLevel(credential: BuilderType): string {
  let level: BaseLevel = "basic";

  // Address is a sign for plus+
  const address = credential.residentialAddress;
  if (address?.proofFile && address?.city && address?.proofCategory) {
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

  return [level, ...addons].join("+");
}

export function deriveKYCLevel(credential: BuilderType): number {
  return 1; // TODO: Implement this
}
