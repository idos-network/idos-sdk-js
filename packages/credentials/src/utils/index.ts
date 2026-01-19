import { Ed25519VerificationKey2020 } from "@digitalbazaar/ed25519-verification-key-2020";

import * as base85 from "base85";
import { every, get } from "es-toolkit/compat";

import type {
  AvailableIssuerType,
  CredentialFields,
  CredentialResidentialAddress,
  CredentialSubject,
  CredentialSubjectFaceId,
  CustomIssuerType,
} from "../types";

export function fileToBase85(file: Buffer): string {
  return base85.encode(file, "ascii85");
}

export function base85ToFile(data: string): Buffer | false {
  return base85.decode(data);
}

export function capitalizeFirstLetter(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

function isIssuerKey(issuer: AvailableIssuerType): issuer is Ed25519VerificationKey2020 {
  return (
    typeof issuer === "object" &&
    issuer !== null &&
    "type" in issuer &&
    "id" in issuer &&
    "controller" in issuer
  );
}

function isCustomIssuerType(issuer: AvailableIssuerType): issuer is CustomIssuerType {
  return (
    typeof issuer === "object" &&
    issuer !== null &&
    "issuer" in issuer &&
    "publicKeyMultibase" in issuer
  );
}

export async function issuerToKey(
  issuer: AvailableIssuerType,
): Promise<Ed25519VerificationKey2020> {
  if (isIssuerKey(issuer)) {
    return issuer;
  }

  if (isCustomIssuerType(issuer)) {
    return await Ed25519VerificationKey2020.from({
      id: `${issuer.issuer}/keys/1`,
      controller: `${issuer.issuer}/issuers/1`,
      publicKeyMultibase: issuer.publicKeyMultibase,
      privateKeyMultibase: issuer.privateKeyMultibase,
      type: "Ed25519VerificationKey2020",
    });
  }

  return await Ed25519VerificationKey2020.from({ ...issuer, type: "Ed25519VerificationKey2020" });
}

export function convertValues<
  K extends
    | CredentialFields
    | CredentialSubject
    | CredentialResidentialAddress
    | CredentialSubjectFaceId,
>(fields: K, prefix?: string): Record<string, unknown> {
  const acc: Record<string, unknown> = {};

  for (const key in fields) {
    if (Object.hasOwn(fields, key)) {
      const value = fields[key];
      const name = prefix ? `${prefix}${capitalizeFirstLetter(key)}` : key;
      if (value instanceof Date) {
        acc[name] = value.toISOString();
      } else if (value instanceof Buffer) {
        // Convert file to base85
        acc[name] = fileToBase85(value);
      } else {
        acc[name] = value;
      }
    }
  }

  return acc;
}

type BaseLevel = "basic" | "plus";
type Addon = "liveness" | "email" | "phoneNumber";

export function deriveLevel(credential: CredentialSubject): string {
  let level: BaseLevel = "basic";

  // Address is a sign for plus+
  const address = credential.residentialAddress;
  if (address?.proofFile && address?.city && address?.proofCategory) {
    level = "plus";
  }

  const addons: Addon[] = [];
  if (credential.selfieFile) {
    addons.push("liveness");
  }

  if (credential.email) {
    addons.push("email");
  }

  if (credential.phoneNumber) {
    addons.push("phoneNumber");
  }

  return [level, ...addons].join("+");
}

export function parseLevel(level: string): {
  base: BaseLevel;
  addons: Addon[];
} {
  const [base, ...addons] = level.split("+") as [BaseLevel, ...Addon[]];
  return { base, addons };
}

export function matchLevelOrHigher(
  level: BaseLevel,
  requiredAddons: Addon[],
  currentLevel: string,
): boolean {
  const { base: currentBaseLevel, addons: currentAddons } = parseLevel(currentLevel);

  // TODO: Consider pop+ or uniqueness+ scenarios
  if (level === "plus" && currentBaseLevel !== "plus") {
    return false;
  }

  return requiredAddons.every((addon) => currentAddons.includes(addon));
}

export function levelScore(level: string): number {
  const { base, addons } = parseLevel(level);
  let score = 0;

  if (base === "plus") {
    score += 100;
  }

  score += addons.length * 10;

  return score;
}

export function pickHighestMatchingLevel(
  levels: string[],
  requiredLevel: BaseLevel,
  requiredAddons: Addon[],
): string | null {
  return (
    levels
      .filter((currentLevel) => matchLevelOrHigher(requiredLevel, requiredAddons, currentLevel))
      .sort((a, b) => {
        const aAddons = levelScore(a);
        const bAddons = levelScore(b);
        return bAddons - aAddons; // descending
      })[0] ?? null
  );
}

export function highestMatchingCredential<K extends { public_notes: string }>(
  credentials: K[],
  requiredLevel: BaseLevel,
  {
    addons: requiredAddons = [],
    publicNotesConstraint = {},
  }: {
    addons?: Addon[];
    publicNotesConstraint?: Record<string, number | string>;
  },
): K | undefined {
  const matchingCredentials = credentials
    .map((credential) => {
      const publicNotes = JSON.parse(credential.public_notes || "{}");
      return {
        credential,
        publicNotes,
      };
    })
    .filter(({ publicNotes }) => {
      const level = publicNotes.level;

      if (!level) {
        return false;
      }

      if (!matchLevelOrHigher(requiredLevel, requiredAddons, level)) {
        return false;
      }

      for (const key in publicNotesConstraint) {
        if (publicNotes[key] !== publicNotesConstraint[key]) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const aLevel = a.publicNotes.level;
      const bLevel = b.publicNotes.level;
      return levelScore(bLevel) - levelScore(aLevel); // descending
    })
    .map(({ credential }) => credential);

  return matchingCredentials[0];
}

export function publicNotesFieldFilter<K extends { public_notes: string; id: string }>(
  credential: K,
  pick: Record<string, unknown[]>,
  omit: Record<string, unknown[]>,
): boolean {
  const matchCriteria = (content: Record<string, unknown>, criteria: Record<string, unknown[]>) =>
    every(Object.entries(criteria), ([path, targetSet]) => targetSet.includes(get(content, path)));

  let publicNotes: Record<string, string>;

  try {
    publicNotes = JSON.parse(credential.public_notes);
  } catch (_) {
    throw new Error(`Credential ${credential.id} has non-JSON public notes".replace("{}`);
  }

  if (Object.keys(pick).length > 0 && !matchCriteria(publicNotes, pick)) {
    // Fast fail on pick criteria
    return false;
  }

  if (Object.keys(omit).length > 0 && matchCriteria(publicNotes, omit)) {
    // Fast fail on omit criteria
    return false;
  }

  return true;
}
