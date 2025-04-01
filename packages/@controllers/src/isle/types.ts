import type { EnclaveOptions } from "@idos-network/core";

/**
 * The theme of the idOS Isle.
 */
export type idOSIsleTheme = "light" | "dark" | "system";

/**
 * Meta information about an actor (consumer or issuer).
 */
export type ActorMeta = {
  url: string;
  name: string;
  logo: string;
};

/**
 * Configuration options for creating an idOS Isle.
 */
export type idOSIsleControllerOptions = {
  /** The ID of the container element where the Isle iframe will be mounted */
  container: string;

  /** Optional theme configuration for the Isle UI */
  theme?: idOSIsleTheme;

  /** enclave options */
  enclaveOptions: EnclaveOptions;

  /**
   * The issuer configuration.
   */
  issuerConfig: {
    meta: ActorMeta;
    encryptionPublicKey: string;
  };

  /**
   * Information about the credential requirements for the embedding app.
   * This information is used to filter and display `AGs` / `Credentials` in the UI.
   */
  credentialRequirements: {
    /** Information about issuers known to the app */
    acceptedIssuers: {
      meta: ActorMeta;
      authPublicKey: string;
    }[];

    /** Information about consumers known to the embedding app. */
    integratedConsumers: {
      meta: ActorMeta;
      consumerAuthPublicKey: string;
      consumerEncryptionPublicKey: string;
      kycPermissions: string[];
    }[];

    /** The type of credential accepted by the app */
    acceptedCredentialType: string;
  };
};

/**
 * Options for requesting a permission (AG).
 */
export type RequestPermissionOptions = {
  /** The consumer information */
  consumer: {
    /** The public key of the consumer */
    consumerAuthPublicKey: string;
    consumerEncryptionPublicKey: string;
    /** Meta information about the consumer */
    meta: ActorMeta;
  };
  KYCPermissions: string[];
};

/**
 * Options for requesting a delegated write grant (DWG).
 */
export type RequestDelegatedWriteGrantOptions = {
  /** The consumer information */
  consumer: {
    /** The public key of the consumer */
    consumerAuthPublicKey: string;
    /** Meta information about the consumer */
    meta: ActorMeta;
  };
  KYCPermissions: string[];
};
