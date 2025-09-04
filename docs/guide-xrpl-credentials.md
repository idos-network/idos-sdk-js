# XRPL Credentials guide

This module provides utilities for creating and managing XRPL Credential transactions. It includes functionality for:
* Creating Credentials on the XRPL blockchain
* Generating Credential acceptance payloads
* Managing both original and copy credentials

## Usage

### CredentialCreate transactions

#### Definitions

```typescript
/**
 * Service class for creating credentials on the XRPL blockchain
 *
 * This service provides methods to create both original and copy credentials
 * on the XRPL. It handles connection management, transaction submission,
 * and proper encoding of credential data according to XRPL specifications.
 */
class XrplCredentialsCreate {
  /**
   * Creates a new XRPL credentials service instance.
   *
   * @param nodeUrl - The WebSocket URL of the XRPL node to connect to
   * @param seed  - The XRPL wallet seed to use for signing transactions
   */
  constructor(nodeUrl: string, seed: string);

  /**
   * Creates a credential on the XRPL that reflects an idOS original credential.
   *
   * This method creates a new credential with the specified type and assigns it to the given user.
   * The credential type is encoded as a hex string, and the credential ID is encoded as a hex URI.
   *
   * @param params - Parameters for creating the original credential
   * @returns Promise resolving to the XRPL transaction result
   */
  async createCredentialForOriginal(params: CreateCredentialForOriginalParams): Promise<any>

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
   */
  async createCredentialForCopy(params: CreateCredentialForCopyParams): Promise<any>
}

```

#### Example

```js
import { Wallet } from "xrpl";
import {
    XrplCredentialsCreate,
} from "@idos-network/utils/xrpl-credentials";

const wallet = Wallet.fromSeed("s...");
const xrplService = new XrplCredentialsCreate("wss://s.devnet.rippletest.net:51233", wallet);

// Create original Credential
await xrplService.createCredentialForOriginal({
  credId: "...uuid...",
  credType: "KYC",
  userAddress: "r..."
});


const result = await xrplService.createCredentialForCopy({
  credId: "...uuid...",
  credType: "KYC",
  userAddress: "r...",
  timelockYears: 5,
  origCredIssuerAddress: "r..."
});

``` 

### CredentialAccept transactions

#### Definitions

```typescript
/**
 * Creates CredentialAccept payload for Issuer Credentials (originals)
 *
 * This function constructs a properly formatted payload for Credential acceptance
 * transactions. The credential type is automatically encoded from UTF-8 to hex
 * format as required by XRPL specifications.
 *
 * @param issuerAddress - The XRPL address of the credential issuer
 * @param accountAddress - The XRPL address of the account accepting the credential
 * @param credentialType - The human-readable idOS credential type (e.g., "KYC")
 * @returns A properly formatted CredentialAcceptPayload object
 */
OriginalCredentialAcceptPayload(
  issuerAddress: string,
  accountAddress: string,
  credentialType: string,
): CredentialAcceptPayload;

/**
 * Creates CredentialAccept payload for Consumer Credentials (copies)
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
 */
export function CopyCredentialAcceptPayload(
  copyCredentialIssuerAddress: string,
  accountAddress: string,
  originalCredentialIssuerAddress: string,
  credentialType: string,
  timelockYears: number,
): CredentialAcceptPayload;
```

#### Example

```js
import { Xumm } from "xumm";
import {
    OriginalCredentialAcceptPayload,
    CopyCredentialAcceptPayload,
} from "@idos-network/utils/xrpl-credentials";

const xumm = new Xumm("Xaman API Key");
await xumm.authorize();

await xumm.payload.createAndSubscribe(
    OriginalCredentialAcceptPayload(
      "rIssuer...",
      "rUser...",
      "KYC",
    ),
);

await xumm.payload.createAndSubscribe(
  CopyCredentialAcceptPayload(
    "rConsumer...",
    "rUser...",
    "rIssuer...",
    "KYC",
    5,
  ),
);
```
