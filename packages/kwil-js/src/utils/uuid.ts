import { parse, validate } from "uuid";

export function isUuid(value: string): boolean {
  return validate(value);
}

export function convertUuidToBytes(uuid: string): Uint8Array {
  return parse(uuid);
}
