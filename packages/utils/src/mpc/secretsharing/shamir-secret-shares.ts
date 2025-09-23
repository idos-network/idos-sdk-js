import { SecretShares } from "./secret-shares";
import { F256 } from "./f256";
import { Lagrange } from "./lagrange";
import { SecretShareFactory } from "./secret-share-factory";
import { randomBytes } from "crypto";

/**
 * Configuration for creating and reconstructing shamir secret shares.
 *
 * <p>The <code>numToReconstruct</code> value must be at least <code>numMalicious + 1</code> to be able
 * to reconstruct.
 *
 * <p>If <code>numToReconstruct</code> is less than <code>2 * numMalicious + 1</code> then there must be
 * some other way to guarantee that the shares are correct, e.g. through commitments on-chain.
 */
export interface ShamirConfig {
  /** Maximum number of malicious nodes. Depends on the threat model. */
  numMalicious: number;
  /** Total number of nodes to receive a share. */
  numNodes: number;
  /** Minimum number of shares needed to reconstruct a secret. */
  numToReconstruct: number;
}

/** Factory for creating elements of {@link ShamirSecretShares}. */
export class ShamirFactory implements SecretShareFactory<ShamirSecretShares> {
  private readonly shamirConfig: ShamirConfig;

  /**
   * Create the {@link ShamirFactory}.
   *
   * @param shamirConfig configuration for creating and reconstructing shamir secret shares.
   */
  constructor(shamirConfig: ShamirConfig) {
    this.shamirConfig = shamirConfig;
  }

  fromPlainText(numNodes: number, plainText: Buffer): ShamirSecretShares {
    if (numNodes != this.shamirConfig.numNodes) {
      throw new Error(
        `This shamir factory expects there to be ${this.shamirConfig.numNodes} nodes, but there was ${numNodes}.`
      );
    }
    const randomElements = randomBytes(plainText.length * this.shamirConfig.numMalicious);
    const alphas = F256.alphas(this.shamirConfig.numNodes);
    const shares: F256[][] = Array.from({ length: this.shamirConfig.numNodes }, () => []);
    for (let i = 0; i < plainText.length; i++) {
      const coefficients = [F256.createElement(plainText[i])];
      for (let j = 0; j < this.shamirConfig.numMalicious; j++) {
        coefficients.push(
          F256.createElement(randomElements[this.shamirConfig.numMalicious * i + j])
        );
      }
      const poly = F256.createPoly(coefficients);
      for (let j = 0; j < this.shamirConfig.numNodes; j++) {
        shares[j].push(poly.evaluate(alphas[j]));
      }
    }

    return new ShamirSecretShares(this.shamirConfig, shares);
  }

  fromSharesBytes(shares: Array<Buffer | undefined>): ShamirSecretShares {
    const elementShares = shares.map((bytes) => {
      if (bytes == undefined) {
        return undefined;
      }
      const elements = [];
      for (let i = 0; i < bytes.length; i++) {
        elements.push(F256.createElement(bytes[i]));
      }
      return elements;
    });
    return new ShamirSecretShares(this.shamirConfig, elementShares);
  }
}

/**
 * Secure secret-sharing scheme based on shamir-secret sharing.
 *
 * <p>Supported number of shares ({@code N}): {@code 4}
 *
 * <p>Based on the java implementation of the secret-sharing client.
 *
 * @see <a href="https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing">Shamir's secret sharing,
 *     Wikipedia</a>
 */
export class ShamirSecretShares implements SecretShares {
  private readonly shares: Array<F256[] | undefined>;
  private readonly shamirConfig: ShamirConfig;

  constructor(shamirConfig: ShamirConfig, shares: Array<F256[] | undefined>) {
    if (shares.length != shamirConfig.numNodes) {
      throw new Error(`There must be ${shamirConfig.numNodes} nodes`);
    }
    const numReceivedShares = shares.filter((s) => s != undefined).length;
    if (numReceivedShares < shamirConfig.numToReconstruct) {
      throw new Error(
        `Must have received at least ${shamirConfig.numToReconstruct} shares to reconstruct. Received ${numReceivedShares}.`
      );
    }
    this.shamirConfig = shamirConfig;
    this.shares = shares;
  }

  getShareBytes(nodeIndex: number): Buffer {
    const share = this.shares[nodeIndex];
    if (share == undefined) {
      throw new Error("Expected share to be defined");
    }
    return Buffer.from(share.map((field) => field.value));
  }

  numShares(): number {
    return this.shamirConfig.numNodes;
  }

  reconstructPlainText(): Buffer {
    const alphas = F256.alphas(this.shamirConfig.numNodes);
    const definedAlphas: F256[] = [];
    const definedShares: F256[][] = [];
    for (let i = 0; i < this.shares.length; i++) {
      const share = this.shares[i];
      if (share != undefined) {
        definedAlphas.push(alphas[i]);
        definedShares.push(share);
      }
    }

    const reconstructedElements = [];
    const numElements = definedShares[0].length;
    for (let i = 0; i < numElements; i++) {
      const sharesOfIthElement = [];
      for (let j = 0; j < definedShares.length; j++) {
        sharesOfIthElement.push(definedShares[j][i]);
      }
      const interpolated = Lagrange.interpolateIfPossible(
        definedAlphas,
        sharesOfIthElement,
        this.shamirConfig.numMalicious,
        F256.ZERO,
        F256.ONE
      );
      if (interpolated === undefined) {
        throw new Error("Unable to reconstruct secret");
      }
      reconstructedElements.push(interpolated.getConstantTerm().value);
    }
    return Buffer.from(reconstructedElements);
  }

  public static readonly FACTORY: SecretShareFactory<ShamirSecretShares> = new ShamirFactory({
    numMalicious: 1,
    numNodes: 4,
    numToReconstruct: 2,
  });
}

export function getRandomBytes(length: number): Buffer {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Buffer.from(array);
}

