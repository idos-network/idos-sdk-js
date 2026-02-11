import { randomBytes } from "crypto";
import type { SecretShareFactory } from "./secret-share-factory";
import type { SecretShares } from "./secret-shares";

/**
 * Secure secret-sharing scheme based on XOR.
 *
 * <p>Supported number of shares (<code>N</code>): <code>2+</code>
 *
 * <p>Threshold for reconstruction: <code>N</code>
 *
 * <p>Based on the java implementation of the secret-sharing client.
 *
 * @see <a href="https://en.wikipedia.org/wiki/Secret_sharing">Secret sharing, Wikipedia</a>
 */
export class XorSecretShares implements SecretShares {
  private readonly shares: Buffer[];

  /** The least number of shares supported by the secret sharing. */
  public static readonly MIN_SHARES = 2;

  constructor(shares: Buffer[]) {
    if (shares.length < XorSecretShares.MIN_SHARES) {
      throw new Error(
        `XorSecretShares requires at least ${XorSecretShares.MIN_SHARES} shares, but specified only ${shares.length}`,
      );
    }
    this.shares = shares;
  }

  getShareBytes(nodeIndex: number): Buffer {
    return this.shares[nodeIndex];
  }

  numShares(): number {
    return this.shares.length;
  }

  reconstructPlainText(): Buffer {
    return xorByteArrays(this.shares[0].length, this.shares);
  }

  public static readonly FACTORY: SecretShareFactory<XorSecretShares> = {
    fromPlainText(numNodes: number, plainText: Buffer): XorSecretShares {
      const shares: Buffer[] = [];
      for (let i = 0; i < numNodes - 1; i++) {
        shares.push(randomBytes(plainText.length));
      }
      const finalShare = xorByteArrays(plainText.length, [...shares, plainText]);
      shares.push(finalShare);
      return new XorSecretShares(shares);
    },
    fromSharesBytes(shares: Array<Buffer | undefined>): XorSecretShares {
      if (shares.filter((b) => b == undefined).length != 0) {
        throw new Error("XorSecretShares must receive elements from all nodes");
      }
      return new XorSecretShares(shares as Buffer[]);
    },
  };
}

function xorByteArrays(length: number, manyBytes: Buffer[]) {
  return Buffer.from(
    manyBytes.reduce((previousValue, currentValue, _currentIndex, _array) => {
      return Buffer.from(previousValue.map((value, index, _array) => value ^ currentValue[index]));
    }, Buffer.alloc(length)),
  );
}
