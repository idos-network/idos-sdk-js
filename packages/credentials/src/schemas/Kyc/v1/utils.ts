import type { BaseLevel, Addon } from "../../../utils";
import type { StructuredObject } from "./schema";

export function deriveLevel(credential: Partial<StructuredObject>): string {
  let level: BaseLevel = "basic";

  // Address proof is a sign for plus+
  const address = credential.residentialAddress;
  if (address?.proofFile && address?.city && address?.proofCategory && address?.country) {
    level = "plus";
  }

  const addons: Addon[] = [];
  if (credential.root?.selfieFile) {
    addons.push("liveness");
  }

  if (credential.root?.email) {
    addons.push("email");
  }

  if (credential.root?.phoneNumber) {
    addons.push("phoneNumber");
  }

  return [level, ...addons].join("+");
}
