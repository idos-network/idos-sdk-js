declare module "ipfs-only-hash" {
  export type IpfsOnlyHashOptions = {
    cidVersion?: number;
    rawLeaves?: boolean;
    chunker?: string;
    hashAlg?: string;
    wrapWithDirectory?: boolean;
    onlyHash?: boolean;
  };

  export function of(
    content: Uint8Array,
    options?: IpfsOnlyHashOptions,
  ): Promise<{
    toString(): string;
  }>;
}
