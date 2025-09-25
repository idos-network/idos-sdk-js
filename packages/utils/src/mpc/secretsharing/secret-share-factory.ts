import { SecretShares } from "./secret-shares";

/**
 * Factory object for create {@link SecretShares}.
 *
 * <p>Based on the java implementation of the secret-sharing client.
 *
 * @param <ShareT> Type of {@link SecretShares} create by the factory object.
 */
export interface SecretShareFactory<ShareT extends SecretShares> {
  /**
   * Create a new {@link SecretShares} from the given plaintext for the given amount of recipient
   * nodes.
   *
   * <p>The factory is allowed to fail if it doesn't support the given amount of recipient nodes.
   *
   * @param numNodes Number of nodes to spread secret-shares across.
   * @param plainText The plain text to be secret-shared. Not nullable.
   * @returns Newly created {@link SecretShares}. Not nullable.
   */
  fromPlainText(numNodes: number, plainText: Buffer): ShareT;

  /**
   * Create a new {@link SecretShares} from the given shares.
   *
   * @param shares Shares to create from.
   * @return Newly created {@link SecretShares}. Not nullable.
   */
  fromSharesBytes(shares: Array<Buffer | undefined>): ShareT;
}
