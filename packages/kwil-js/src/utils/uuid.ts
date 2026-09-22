import { hexToBytes } from "./serial";

// Matches uuid@11's `validate`: RFC 9562 versions 1-8, plus the nil and max UUIDs.
const UUID_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function convertUuidToBytes(uuid: string): Uint8Array {
  return hexToBytes(uuid.replaceAll("-", ""));
}
