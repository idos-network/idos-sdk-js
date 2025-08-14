import * as Hex from "@stablelib/hex";
import * as Utf8 from "@stablelib/utf8";
import { Client, decodeAccountID, Wallet } from "xrpl";

/**
 * Parameters for creating an original credential on XRPL
 */
export type CreateCredentialForOriginalParams = {
  /** Unique identifier for the idOS credential, like `741a9caf-ec53-42c7-aed6-519950dcded5` */
  credId: string;
  /** Type/category of the credential, like `KYC` */
  credType: string;
  /** XRPL address of the user receiving the credential, like `rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe` */
  userAddress: string;
};

/**
 * Parameters for creating a time-locked copy credential on XRPL
 */
export type CreateCredentialForCopyParams = {
  /** Unique identifier for the idOS credential */
  credId: string;
  /** Type/category of the credential */
  credType: string;
  /** XRPL address of the user receiving the credential */
  userAddress: string;
  /** Number of years to lock the credential (must be non-negative integer) */
  timelockYears: number;
  /** XRPL address of the original credential issuer */
  origCredIssuerAddress: string;
};

/**
 * Service class for creating credentials on the XRPL blockchain
 *
 * This service provides methods to create both original and copy credentials
 * on the XRPL. It handles connection management, transaction submission,
 * and proper encoding of credential data according to XRPL specifications.
 *
 * @example
 * ```typescript
 * const wallet = Wallet.fromSeed("s...");
 * const xrplService = new XrplCredentialsCreate("wss://s.devnet.rippletest.net:51233", wallet);
 *
 * // Create original credential
 * await xrplService.createCredentialForOriginal({
 *   credId: "741a9caf-ec53-42c7-aed6-519950dcded5",
 *   credType: "KYC",
 *   userAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
 * });
 * ```
 */
export class XrplCredentialsCreate {
  readonly #client: Client;
  readonly #wallet: Wallet;

  /**
   * Creates a new XRPL credentials service instance.
   *
   * @param nodeUrl - The WebSocket URL of the XRPL node to connect to
   * @param seed  - The XRPL wallet seed to use for signing transactions
   */
  constructor(nodeUrl: string, seed: string) {
    this.#client = new Client(nodeUrl);
    this.#wallet = Wallet.fromSeed(seed);
  }

  /**
   * Creates a credential on the XRPL that reflects an idOS original credential.
   *
   * This method creates a new credential with the specified type and assigns it to the given user.
   * The credential type is encoded as a hex string, and the credential ID is encoded as a hex URI.
   *
   * @param params - Parameters for creating the original credential
   * @returns Promise resolving to the XRPL transaction result
   *
   * @example
   * ```typescript
   * await xrplService.createCredentialForOriginal({
   *   credId: "741a9caf-ec53-42c7-aed6-519950dcded5",
   *   credType: "KYC",
   *   userAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
   * });
   * ```
   */
  async createCredentialForOriginal(params: CreateCredentialForOriginalParams): Promise<any> {
    const { credId, credType, userAddress } = params;

    // Connect to the XRPL node
    await this.#client.connect();

    // Submit the credential creation transaction and wait for confirmation
    const res = await this.#client.submitAndWait(
      {
        TransactionType: "CredentialCreate",
        Account: this.#wallet.address,
        Subject: userAddress,
        // Encode credential type as hex string (required by XRPL)
        CredentialType: Hex.encode(Utf8.encode(credType)),
        // Encode credential ID as hex URI (required by XRPL)
        URI: Hex.encode(Buffer.from(credId)),
      },
      {
        wallet: this.#wallet,
      },
    );

    // Disconnect from the XRPL node
    await this.#client.disconnect();

    return res;
  }

  /**
   * Creates a time-locked credential copy on the XRPL.
   *
   * This method creates a Credential object in XRPL that reflects an idOS credential copy.
   * The credential type includes metadata about the original issuer and time-lock duration.
   * The composite credential type follows the format: "AG-{type}-{originalIssuer}-{timelock}Y"
   *
   * @param params - Parameters for creating the time-locked credential copy
   * @returns Promise resolving to the XRPL transaction result
   *
   * @throws {Error} When timelockYears is not a non-negative integer
   *
   * @example
   * ```typescript
   * const result = await xrplService.createCredentialForCopy({
   *   credId: "741a9caf-ec53-42c7-aed6-519950dcded5",
   *   credType: "KYC",
   *   userAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
   *   timelockYears: 5,
   *   origCredIssuerAddress: "rU9C67bZ3ZvjXaJYwYqMqjMq1o4ZbwK3YN"
   * });
   * ```
   */
  async createCredentialForCopy(params: CreateCredentialForCopyParams): Promise<any> {
    const { credId, credType, userAddress, timelockYears, origCredIssuerAddress } = params;

    // Validate timelockYears is a non-negative integer
    if (!Number.isInteger(timelockYears) || timelockYears < 0) {
      throw new Error("timelockYears must be a non-negative integer");
    }

    // Connect to the XRPL node
    await this.#client.connect();

    // Create composite credential type with metadata:
    // Format: "AG-{credType}-{originalIssuer}-{timelock}Y"
    const type = Buffer.concat([
      Utf8.encode("AG"), // "AG" prefix for copy credentials
      Utf8.encode("-"), // Separator
      Utf8.encode(credType), // Original credential type
      Utf8.encode("-"), // Separator
      decodeAccountID(origCredIssuerAddress), // Original issuer address (decoded)
      Utf8.encode("-"), // Separator
      Utf8.encode(`${timelockYears}Y`), // Timelock period in years
    ]);

    // Submit the credential copy creation transaction and wait for confirmation
    const res = await this.#client.submitAndWait(
      {
        TransactionType: "CredentialCreate",
        Account: this.#wallet.address,
        Subject: userAddress,
        // Use the composite credential type with metadata
        CredentialType: Hex.encode(type),
        // Encode credential ID as hex URI (required by XRPL)
        URI: Hex.encode(Buffer.from(credId)),
      },
      {
        wallet: this.#wallet,
      },
    );

    // Disconnect from the XRPL node
    await this.#client.disconnect();

    return res;
  }
}
