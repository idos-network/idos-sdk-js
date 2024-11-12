declare module "ascii85" {
  export function encode(data: Buffer | string): string;
  export function decode(data: string): Uint8Array;
}
