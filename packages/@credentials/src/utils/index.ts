import * as base85 from "base85";
import type { CredentialFields, CredentialResidentialAddress, CredentialSubject } from "./types";

export function fileToBase85(file: Buffer): string {
  return base85.encode(file, "ascii85");
}

export function capitalizeFirstLetter(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

export function convertValues<
  K extends CredentialFields | CredentialSubject | CredentialResidentialAddress,
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
