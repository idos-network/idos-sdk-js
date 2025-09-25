/**
 * A finite field element.
 *
 * <p>Copied from <a href="https://gitlab.com/partisiablockchain/language/abi/zk-client"> zk-client</a>.
 */
export interface FiniteFieldElement<T> {
  /**
   * Field element addition.
   * @param other the right-hand side
   */
  readonly add: (other: T) => T;
  /**
   * Field element subtraction.
   * @param other the right-hand side
   */
  readonly subtract: (other: T) => T;
  /**
   * Field element multiplication.
   * @param other the right-hand side
   */
  readonly multiply: (other: T) => T;
  /**
   * Negate this element.
   */
  readonly negate: () => T;
  /**
   * Return the multiplicative inverse of this element.
   */
  readonly modInverse: () => T;
  /**
   * Get the square root of the element.
   */
  readonly squareRoot: () => T;
  /**
   * Whether this element is zero.
   * @returns true if zero
   */
  readonly isZero: () => boolean;
  /**
   * Whether this element is one.
   * @returns true if one
   */
  readonly isOne: () => boolean;
  /**
   * Whether this element is equal to the specified element.
   * @param other the element to check
   * @returns the equality
   */
  readonly isEqualTo: (other: T) => boolean;
}
