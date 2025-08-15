import * as Hex from "@stablelib/hex";
import * as Utf8 from "@stablelib/utf8";
import { decodeAccountID } from "xrpl";

/**
 * Payload structure for XRPL CredentialAccept transaction
 *
 * This type defines the required fields for creating a credential acceptance
 * transaction on the XRP Ledger. The CredentialType field is automatically
 * encoded as a hex string from the UTF-8 representation of the credential type.
 */
export type CredentialAcceptPayload = {
  /** Transaction type identifier - must be "CredentialAccept" */
  TransactionType: "CredentialAccept";
  /** The issuer's XRPL address who created the Credential object */
  Issuer: string;
  /** The account's XRPL address who is receiving the credential */
  Account: string;
  /** The type of credential being accepted (encoded as hex string) */
  CredentialType: string;
};

/**
 * Creates a credential acceptance payload for XRPL transactions
 *
 * This function constructs a properly formatted payload for credential acceptance
 * transactions. The credential type is automatically encoded from UTF-8 to hex
 * format as required by XRPL specifications.
 *
 * @param issuerAddress - The XRPL address of the credential issuer
 * @param accountAddress - The XRPL address of the account accepting the credential
 * @param credentialType - The human-readable idOS credential type (e.g., "KYC")
 * @returns A properly formatted CredentialAcceptPayload object
 *
 * @example
 * ```typescript
 * const payload = OriginalCredentialAcceptPayload(
 *   "rIssuerAddress123...",
 *   "rAccountAddress456...",
 *   "KYC"
 * );
 * // Result: {
 * //   TransactionType: "CredentialAccept",
 * //   Issuer: "rIssuerAddress123...",
 * //   Account: "rAccountAddress456...",
 * //   CredentialType: "4B5943" // Hex encoded "KYC"
 * // }
 * ```
 */
export function OriginalCredentialAcceptPayload(
  issuerAddress: string,
  accountAddress: string,
  credentialType: string,
): CredentialAcceptPayload {
  // Encode the credential type from UTF-8 to hex format
  // This is required by XRPL for proper transaction processing
  const encodedCredentialType = Hex.encode(Utf8.encode(credentialType));

  return {
    TransactionType: "CredentialAccept",
    Issuer: issuerAddress,
    Account: accountAddress,
    CredentialType: encodedCredentialType,
  };
}

/**
 * Creates a copy credential acceptance payload for XRPL transactions
 *
 * This function constructs a payload for accepting a copy of an existing credential
 * with additional metadata including the original issuer and a timelock period.
 * The CredentialType field is encoded as a composite string containing:
 * - "AG-" prefix (indicating copy credential)
 * - Original credential type
 * - Original issuer address
 * - Timelock period in years
 *
 * @param copyCredentialIssuerAddress - The XRPL address of the issuer created a XRPL Credential object related to idOS credential copy
 * @param accountAddress - The XRPL address of the account accepting the credential copy
 * @param originalCredentialIssuerAddress - The XRPL address of the issuer created a XRPL Credential object related to idOS original credential
 * @param credentialType - The human-readable idOScredential type (e.g., "KYC")
 * @param timelockYears - The number of years for the timelock period (must be non-negative integer)
 * @returns A properly formatted CredentialAcceptPayload object for copy credentials
 * @throws {Error} When timelockYears is not a non-negative integer
 *
 * @example
 * ```typescript
 * const payload = CopyCredentialAcceptPayload(
 *   "rCopyIssuerAddress123...",
 *   "rAccountAddress456...",
 *   "rOriginalIssuerAddress789...",
 *   "KYC",
 *   2
 * );
 * // Result: {
 * //   TransactionType: "CredentialAccept",
 * //   Issuer: "rCopyIssuerAddress123...",
 * //   Account: "rAccountAddress456...",
 * //   CredentialType: "41472D4B59432D..." // Hex encoded "AG-KYC-{originalIssuer}-2Y"
 * // }
 * ```
 */
export function CopyCredentialAcceptPayload(
  copyCredentialIssuerAddress: string,
  accountAddress: string,
  originalCredentialIssuerAddress: string,
  credentialType: string,
  timelockYears: number,
): CredentialAcceptPayload {
  // Validate that timelockYears is a non-negative integer
  if (!Number.isInteger(timelockYears) || timelockYears < 0) {
    throw new Error("timelockYears must be a non-negative integer");
  }

  // Create a composite credential type string that includes:
  // - "AG-" prefix (indicating this is a copy credential)
  // - Original credential type
  // - Original issuer Account ID (decoded from XRPL address format)
  // - Timelock period in years
  const type = Buffer.concat([
    Utf8.encode("AG"),
    Utf8.encode("-"),
    Utf8.encode(credentialType),
    Utf8.encode("-"),
    decodeAccountID(originalCredentialIssuerAddress),
    Utf8.encode("-"),
    Utf8.encode(`${timelockYears}Y`),
  ]);

  return {
    TransactionType: "CredentialAccept",
    Issuer: copyCredentialIssuerAddress,
    Account: accountAddress,
    CredentialType: Hex.encode(type),
  };
}
