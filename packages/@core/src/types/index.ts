import type { Wallet as NearWallet } from "@near-wallet-selector/core";
import type { Wallet as EthersWallet, JsonRpcSigner } from "ethers";
export type Wallet = EthersWallet | JsonRpcSigner | NearWallet;

export const CHAIN_TYPES = ["EVM", "NEAR"] as const;
export type ChainType = (typeof CHAIN_TYPES)[number];

export type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

export interface idOSUser {
  id: string;
  recipient_encryption_public_key: string;
}

export interface idOSCredential {
  id: string;
  user_id: string;
  issuer_auth_public_key: string;
  original_id?: string;
  public_notes: string;
  content: string;
  encryptor_public_key: string;
}

export interface idOSWallet {
  id: string;
  user_id: string;
  address: string;
  wallet_type: string;
  message: string;
  public_key: string;
  signature: string;
}

export interface idOSUserAttribute {
  id: string;
  attribute_key: string;
  value: string;
  user_id?: string;
}

export interface idOSGrant {
  id: string;
  ag_owner_user_id: string;
  ag_grantee_wallet_identifier: string;
  data_id: string;
  locked_until: number;
  content_hash?: string;
}

export type InsertableIDOSCredential = Omit<idOSCredential, "id" | "original_id"> & {
  id?: idOSCredential["id"];
  content_hash?: string;
  public_notes_signature: string;
  broader_signature: string;
};

/**
 * Following types are specific to the isle post message protocol
 */
export type IsleTheme = "light" | "dark";

export type IsleStatus =
  | "initializing"
  | "no-profile"
  | "not-verified"
  | "pending-verification"
  | "pending-permissions"
  | "verified"
  | "not-connected"
  | "error";

export type IsleControllerMessage =
  | {
      type: "initialize";
      data: {
        theme?: IsleTheme;
      };
    }
  | {
      type: "update";
      data: {
        address?: string;
        theme?: IsleTheme;
        status?: IsleStatus;
        accessGrants?: WeakMap<
          { name: string; logo: string },
          { id: string; dataId: string; type: string }[]
        >;
      };
    }
  | {
      type: "update-create-profile-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
      };
    }
  | {
      type: "update-create-dwg-status";
      data: {
        status: "idle" | "pending" | "success" | "verify-identity" | "error";
      };
    }
  | {
      type: "update-create-dwg-status";
      data: {
        status: "start-verification";
        meta: {
          url: string;
          name: string;
          logo: string;
          KYCPermissions: string[];
        };
      };
    }
  | {
      type: "update-revoke-access-grant-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
      };
    }
  | {
      type: "update-request-access-grant-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
      };
    }
  | {
      type: "update-request-access-grant-status";
      data: {
        status: "request-permission";
        consumer: {
          consumerPublicKey: string;
          meta: {
            url: string;
            name: string;
            logo: string;
          };
        };
        KYCPermissions: string[];
      };
    }
  | {
      type: "update-view-credential-details-status";
      data: {
        status: "idle" | "pending" | "success" | "error";
        credential?: idOSCredential;
        error?: Error;
      };
    }
  | {
      type: "credential-details";
      data: {
        credential: idOSCredential;
      };
    }
  | {
      type: "toggle-animation";
      data: {
        expanded: boolean;
        noDismiss?: boolean;
      };
    };

export type IsleNodeMessage =
  | {
      type: "initialized";
      data: {
        theme: IsleTheme;
      };
    }
  | {
      type: "updated";
      data: {
        theme?: IsleTheme;
        status?: IsleStatus;
      };
    }
  | {
      type: "connect-wallet";
    }
  | {
      type: "link-wallet";
    }
  | {
      type: "create-profile";
    }
  | {
      type: "request-dwg";
    }
  | {
      type: "verify-identity";
    }
  | {
      type: "revoke-permission";
      data: {
        id: string;
      };
    }
  | {
      type: "view-credential-details";
      data: {
        id: string;
      };
    }
  | {
      type: "share-credential";
      data: {
        id: string;
      };
    };

export type IsleMessageHandler<T extends IsleNodeMessage["type"]> = (
  message: Extract<IsleNodeMessage, { type: T }>,
) => void;
