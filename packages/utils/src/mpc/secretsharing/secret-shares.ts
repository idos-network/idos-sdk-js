/**
 * All shares of a specific secure secret-sharing scheme.
 *
 * <p>Constructed either from a plain-text or from all shares of the plain-text. Can be converted
 * into the individual shares, or into the plain-text.
 *
 * <p>Based on the java implementation of the secret-sharing client.
 *
 * @see <a href="https://en.wikipedia.org/wiki/Secret_sharing">Secret sharing, Wikipedia</a>
 */
export interface SecretShares {
  /** Get number of shares that this {@link SecretShares} have been split over. */
  numShares(): number;

  /** Get the secret-share for the given node index. */
  getShareBytes(nodeIndex: number): Buffer;

  /** Reconstruct plaintext from all the shares of the {@link SecretShares} object. */
  reconstructPlainText(): Buffer;
}
