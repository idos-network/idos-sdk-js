import type { FiniteFieldElement } from "./finite-field-element";

/** Polynomials with coefficients in a finite field. */
export class Polynomial<T extends FiniteFieldElement<T>> {
  private readonly coefficients: T[];

  private constructor(coefficients: T[]) {
    this.coefficients = coefficients;
  }

  /**
   * Construct a polynomial from a set of coefficients. The degree of the resultant polynomial is
   * assumed to be equal to the number of coefficients minus 1. The constant term of the polynomial
   * is assumed to be stored in the first position of the coefficients.
   *
   * @param coefficients the coefficients of the polynomial
   * @param zero zero element of the field
   * @return the constructed polynomial
   */
  static create<T extends FiniteFieldElement<T>>(coefficients: T[], zero: T): Polynomial<T> {
    return new Polynomial<T>(Polynomial.filterHighZeroes(coefficients, zero));
  }

  private static filterHighZeroes<T extends FiniteFieldElement<T>>(
    coefficients: T[],
    zero: T,
  ): T[] {
    for (let i = coefficients.length - 1; i >= 0; i--) {
      if (!coefficients[i].isZero()) {
        return coefficients.slice(0, i + 1);
      }
    }
    return [zero];
  }

  /**
   * Returns the coefficients of the polynomial.
   *
   * @return the coefficients of the polynomial
   */
  getCoefficients(): T[] {
    return this.coefficients.slice();
  }

  /**
   * Returns the degree of this polynomial.
   *
   * @return the degree of the polynomial
   */
  degree(): number {
    return this.coefficients.length - 1;
  }

  /**
   * Returns the constant term of the polynomial.
   *
   * @return the term stored on position 0 of the coefficients of this polynomial
   */
  getConstantTerm(): T {
    return this.coefficients[0];
  }

  /**
   * Evaluates this polynomial on a point. That is, if F is the polynomial and x a value, then this
   * method returns F(x).
   *
   * @param point the point to evaluate this polynomial on
   * @return F(point) where F is this polynomial
   */
  evaluate(point: T): T {
    const degree = this.degree();

    let result = this.coefficients[degree];
    for (let i = degree - 1; i >= 0; --i) {
      const current = this.coefficients[i];
      result = current.add(point.multiply(result));
    }
    return result;
  }
}
