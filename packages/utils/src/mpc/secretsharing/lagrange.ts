import { FiniteFieldElement } from "./finite-field-element";
import { Polynomial } from "./polynomial";

// File copied from <a href="https://gitlab.com/partisiablockchain/language/abi/zk-client"> zk-client</a>.

/**
 * Try to interpolate a polynomial that passes through the supplied points.
 *
 * @param xs x-coordinates in the points
 * @param ys y-coordinates in the points
 * @param zero 0 element in the Finite Field.
 * @param one 1 element in the Finite Field.
 *
 * @returns the interpolated polynomial or null if unable to interpolate
 */
function interpolate<T extends FiniteFieldElement<T>>(
  xs: readonly T[],
  ys: T[],
  zero: T,
  one: T
): Polynomial<T> {
  if (xs.length !== ys.length) {
    throw new Error("xs and ys must be of same size");
  }

  if (xs.length === 0) {
    throw new Error("xs and ys must have at least one element");
  }

  const n = xs.length;
  const c: T[] = Array(n).fill(one);
  c[0] = one;

  for (let i = 0; i < n; i++) {
    for (let j = i; j > 0; j--) {
      c[j] = c[j - 1].subtract(c[j].multiply(xs[i]));
    }
    c[0] = c[0].multiply(xs[i].negate());
  }

  const coefficients: T[] = Array(n).fill(zero);
  // Stryker disable next-line ArrayDeclaration
  const tc: T[] = Array(n).fill(zero);
  tc[n - 1] = one;
  for (let i = 0; i < n; i++) {
    let denominator = one;
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        denominator = denominator.multiply(xs[i].subtract(xs[j]));
      }
    }

    const t: T = ys[i].multiply(denominator.modInverse());
    coefficients[n - 1] = coefficients[n - 1].add(t.multiply(tc[n - 1]));

    for (let j = n - 2; j >= 0; j--) {
      tc[j] = c[j + 1].add(tc[j + 1].multiply(xs[i]));
      coefficients[j] = coefficients[j].add(t.multiply(tc[j]));
    }
  }

  return Polynomial.create(coefficients, zero);
}

/**
 * Interpolate the minimal polynomial that passes through all the supplied points. And verify that
 * the polynomial has a degree less that maximalDegree.
 *
 * @param xs x-coordinates in the points
 * @param ys y-coordinates in the points
 * @param zero 0 element in the Finite Field.
 * @param one 1 element in the Finite Field.
 * @param maximalDegree the expected maximal degree
 * @return the interpolated polynomial
 */
function interpolateCheckDegree<T extends FiniteFieldElement<T>>(
  xs: readonly T[],
  ys: T[],
  maximalDegree: number,
  zero: T,
  one: T
): Polynomial<T> {
  const poly = interpolate(xs, ys, zero, one);
  if (poly.degree() > maximalDegree) {
    throw new Error(
      `Interpolated polynomial has too high degree. Expected maximal=${maximalDegree}, actual=${poly.degree()}`
    );
  }
  return poly;
}

/**
 * Try to interpolate a polynomial that passes through at least <code>2 &sdot; maximalDegree + 1
 * </code> of the supplied points.
 *
 * <p>Element lists ({@code xs} and {@code ys}) must have same size.
 *
 * @param xs x-coordinates in the points
 * @param ys y-coordinates in the points
 * @param maximalDegree the expected maximal degree
 * @param zero 0 element in the Finite Field.
 * @param one 1 element in the Finite Field.
 *
 * @returns the interpolated polynomial or undefined if unable to interpolate
 */
function interpolateIfPossible<T extends FiniteFieldElement<T>>(
  xs: readonly T[],
  ys: T[],
  maximalDegree: number,
  zero: T,
  one: T
): Polynomial<T> | undefined {
  if (xs.length !== ys.length) {
    throw new Error("xs and ys must be of same size");
  }
  return interpolateIfPossibleInner(xs, ys, maximalDegree, zero, one);
}

function interpolateIfPossibleInner<T extends FiniteFieldElement<T>>(
  xs: readonly T[],
  ys: T[],
  maximalDegree: number,
  zero: T,
  one: T
): Polynomial<T> | undefined {
  if (xs.length <= 2 * maximalDegree + 1) {
    const interpolated = interpolate(xs, ys, zero, one);
    if (interpolated.degree() > maximalDegree) {
      return undefined;
    } else {
      return interpolated;
    }
  } else {
    for (let removeIndex = 0; removeIndex < xs.length; removeIndex++) {
      const interpolated = interpolateIfPossibleInner(
        withoutIndex(xs, removeIndex),
        withoutIndex(ys, removeIndex),
        maximalDegree,
        zero,
        one
      );
      if (interpolated !== undefined) {
        return interpolated;
      }
    }
    return undefined;
  }
}

function withoutIndex<T>(values: readonly T[], removeIndex: number): T[] {
  return values.filter((_value, index, _array) => index != removeIndex);
}

/**
 * Utility for lagrange interpolation.
 */
export const Lagrange: {
  interpolate: typeof interpolate,
  interpolateCheckDegree: typeof interpolateCheckDegree,
  interpolateIfPossible: typeof interpolateIfPossible;
} = {
  interpolate,
  interpolateCheckDegree,
  interpolateIfPossible,
};
