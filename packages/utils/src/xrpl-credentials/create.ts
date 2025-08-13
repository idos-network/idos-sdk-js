import * as Hex from "@stablelib/hex";
import * as Utf8 from "@stablelib/utf8";
import { Client, decodeAccountID, Wallet } from "xrpl";

export type CreateCredentialForOriginalParams = {
  /** Unique identifier for the credential, like `741a9caf-ec53-42c7-aed6-519950dcded5` */
  credId: string;
  /** Type/category of the credential, like `KYC` */
  credType: string;
  /** XRPL address of the user receiving the credential, like `rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe` */
  userAddress: string;
};

export type CreateCredentialForCopyParams = {
  /** Unique identifier for the credential */
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
 * This service provides methods to create credentials on the XRPL blockchain.
 *
 * @example
 * ```typescript
 * const wallet = Wallet.fromSeed("s...");
 * const xrplService = new XrplService("wss://s.devnet.rippletest.net:51233", wallet);
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
   * Creates a new XRPL service instance.
   *
   * @param nodeUrl - The WebSocket URL of the XRPL node to connect to
   * @param seed    - The XRPL wallet seed to use for signing transactions
   */
  constructor(nodeUrl: string, seed: string) {
    this.#client = new Client(nodeUrl);
    this.#wallet = Wallet.fromSeed(seed);
  }

  /**
   * Creates a credential on the XRPL that reflects an idOS original credential.
   *
   * This method creates a new credential with the specified type and assigns it to the given user.
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

    await this.#client.connect();
    const res = await this.#client.submitAndWait(
      {
        TransactionType: "CredentialCreate",
        Account: this.#wallet.address,
        Subject: userAddress,
        CredentialType: Hex.encode(Utf8.encode(credType)),
        URI: Hex.encode(Buffer.from(credId)),
      },
      {
        wallet: this.#wallet,
      },
    );
    console.log("createCredentialForOriginal result:", JSON.stringify(res, null, 2));

    await this.#client.disconnect();

    return res;
  }

  /**
   * Creates a time-locked credential copy on the XRPL.
   *
   * This method creates a Credential object in XRPL that reflects an idOS credential copy.
   * The credential type includes metadata about the original issuer and time-lock duration.
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
    await this.#client.connect();

    const type = Buffer.concat([
      Utf8.encode("AG"),
      Utf8.encode("-"),
      Utf8.encode(credType),
      Utf8.encode("-"),
      decodeAccountID(origCredIssuerAddress),
      Utf8.encode("-"),
      Utf8.encode(`${timelockYears}Y`),
    ]);
    const res = await this.#client.submitAndWait(
      {
        TransactionType: "CredentialCreate",
        Account: this.#wallet.address,
        Subject: userAddress,
        CredentialType: Hex.encode(type),
        URI: Hex.encode(Buffer.from(credId)),
      },
      {
        wallet: this.#wallet,
      },
    );
    console.log("createCredentialForCopy result:", JSON.stringify(res, null, 2));

    await this.#client.disconnect();

    return res;
  }
}
