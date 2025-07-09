import { F256 } from "./F256";
import { Lagrange } from "./Lagrange";
import type { Polynomial } from "./Polynomial";

/**
 * Binary data which has been broken into secret shares. BinarySecretShares are distributed among ZK
 * nodes when inputting a secret variable, and received from ZK nodes when reconstructing a secret
 * variable.
 */
export class BinarySecretShares {
  private readonly secretShares: Array<Share | undefined>;

  static readonly ALPHAS = F256.computationAlphas();

  /**
   * Constructs secret shares from a list of shares. The list contains a share for each
   * sending/receiving party of the secret data.
   *
   * @param secretShares the list of shares
   */
  constructor(secretShares: Array<Share | undefined>) {
    this.secretShares = secretShares;
  }

  /**
   * Creates binary secret shares from binary secret data. For each secret byte a random polynomial
   * of degree 1 is created with the secret byte embedded as the constant term. To create each share
   * of the byte the polynomial is evaluated at a point.
   *
   * @param variableData binary secret variable data to create the secret shares from
   * @param rng randomness generator used to generate random polynomials
   * @return the created shares.
   */
  public static create(variableData: Buffer, rng?: (ln: number) => Buffer): BinarySecretShares {
    const random = rng ?? getRandomBytes;

    const sharedElements: F256[][] = [];
    for (let i = 0; i < BinarySecretShares.ALPHAS.length; i++) {
      sharedElements.push([]);
    }

    for (let i = 0; i < variableData.length; i++) {
      const secret = F256.createElement(variableData[i]);

      const polynomial = BinarySecretShares.generatePolynomial(secret, random);

      for (let j = 0; j < BinarySecretShares.ALPHAS.length; j++) {
        const share = polynomial.evaluate(BinarySecretShares.ALPHAS[j]);
        sharedElements[j].push(share);
      }
    }

    return new BinarySecretShares(sharedElements.map((s) => new Share(s)));
  }

  /**
   * Create binary secret shares from bytes read from ZK nodes.
   *
   * @param rawShares list of raw shares read from ZK nodes
   * @return the created shares
   */
  public static read(rawShares: Array<Buffer | undefined>): BinarySecretShares {
    if (rawShares.filter((x) => x !== undefined).length < 3) {
      throw new Error("Not enough shares to reconstruct");
    }
    const readShares = rawShares.map((s) => (s === undefined ? undefined : Share.read(s)));
    return new BinarySecretShares(readShares);
  }

  /**
   * Generates a random polynomial of degree 2:
   *
   * <p><i>f(x)= secret + random1*x + random2*x</i>
   *
   * <p>such that f(0) match the provided secret.
   *
   * @param secret the secret to be embedded in the constant term
   * @param rng randomness generator used to generate random byte
   * @return a random polynomial generated with the secret and a random number as coefficients.
   */
  private static generatePolynomial(secret: F256, rng: (ln: number) => Buffer): Polynomial<F256> {
    const randomByte1 = rng(1)[0];
    const randomByte2 = rng(1)[0];
    const random1 = F256.createElement(randomByte1);
    const random2 = F256.createElement(randomByte2);
    return F256.createPoly([secret, random1, random2]);
  }

  public getShares(): Buffer[] {
    return this.secretShares.map((share) => share!.serialize());
  }

  /**
   * Reconstruct the secret variable data from these BinarySecretShares. First the shares of each
   * byte of the secret variable data is grouped. Then, a polynomial is interpolated from the shares
   * of each byte. The constant term of this polynomial is the value of the secret byte. Lastly, the
   * secret bytes are collected in a byte array to form the secret variable data.
   *
   * @return the reconstructed binary secret variable data
   */
  public reconstructSecret(): Buffer {
    const result = [];
    for (let i = 0; i < this.getByteLength(); i++) {
      result.push(this.reconstructSecretByte(i));
    }
    return Buffer.from(result);
  }

  /**
   * Reconstructs one byte of the secret variable data which these binary secret shares constitute. A
   * polynomial is interpolated from the shares of the byte, and the constant term of this polynomial
   * is returned as the reconstructed byte.
   *
   * @param i index of the byte to reconstruct
   * @return the reconstructed byte
   */
  private reconstructSecretByte(i: number): number {
    const alphas: F256[] = [];
    const sharesOfByte: F256[] = [];
    const possibleUndefined = this.secretShares.map((share) => share?.byteElements[i]);
    for (let j = 0; j < possibleUndefined.length; j++) {
      const possibleUndefinedElement = possibleUndefined[j];
      if (possibleUndefinedElement !== undefined) {
        alphas.push(BinarySecretShares.ALPHAS[j]);
        sharesOfByte.push(possibleUndefinedElement);
      }
    }

    const polynomial = Lagrange.interpolateCheckDegree(
      alphas,
      sharesOfByte,
      2,
      F256.ZERO,
      F256.ONE,
    );
    return polynomial.getConstantTerm().value;
  }

  private getByteLength() {
    return this.secretShares.filter((x) => x !== undefined)[0].byteElements.length;
  }

  /**
   * Returns the amount of shares.
   *
   * @return the size of the share list
   */
  public noOfShares(): number {
    return this.secretShares.length;
  }
}

/**
 * Secret shares are disjoint parts of a secret input. A secret share consists of a list of
 * F256s which are in turn secret shares of a single byte.
 */
export class Share {
  readonly byteElements: F256[];

  /**
   * Constructs a secret share from a list of byte elements.
   *
   * @param byteElements the byte elements that constitutes the share
   */
  constructor(byteElements: F256[]) {
    this.byteElements = byteElements;
  }

  /**
   * Read a binary share from a stream, in the format specified by the ZK nodes. This is used when
   * shares are fetched from ZK nodes during reconstruction of a secret variable.
   *
   * @param shareBytes the buffer to read the share from
   * @return the read share
   */
  public static read(shareBytes: Buffer): Share {
    const sharesOfBytes: F256[] = [];
    for (let i = 0; i < shareBytes.length; i++) {
      const shareOfByte = F256.createElement(shareBytes[i]);
      sharesOfBytes.push(shareOfByte);
    }
    return new Share(sharesOfBytes);
  }

  /**
   * Serializes each byte element of the share.
   *
   * @return the serialized share
   */
  public serialize(): Buffer {
    return Buffer.from(this.byteElements.map((b) => b.value));
  }

  isEqualTo(that: Share): boolean {
    if (that.byteElements.length !== this.byteElements.length) {
      return false;
    }
    for (let i = 0; i < this.byteElements.length; i++) {
      if (!that.byteElements[i].isEqualTo(this.byteElements[i])) {
        return false;
      }
    }
    return true;
  }
}

// It works only in browsers
export function getRandomBytes(length: number): Buffer {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);

  return Buffer.from(array);
}
