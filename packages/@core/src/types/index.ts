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
  user_id: string;
  attribute_key: string;
  value: string;
}

export interface idOSGrant {
  id: string;
  ag_owner_user_id: string;
  ag_grantee_wallet_identifier: string;
  data_id: string;
  locked_until: number;
  content_hash?: string;
}

/**
 * Following types are specific to the isle post message protocol
 */
export type IsleTheme = "light" | "dark";
export type IsleConnectionStatus =
  | "initializing"
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";
export type IsleStatus =
  | "initializing"
  | "no-profile"
  | "not-verified"
  | "pending-verification"
  | "verified"
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
        connectionStatus?: IsleConnectionStatus;
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
        grantee: {
          granteePublicKey: string;
          meta: {
            url: string;
            name: string;
            logo: string;
          };
        };
        KYCPermissions: string[];
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
        connectionStatus?: IsleConnectionStatus;
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
      type: "revoke-access-grant";
      data: {
        id: string;
      };
    };

export type IsleMessageHandler<T extends IsleNodeMessage["type"]> = (
  message: Extract<IsleNodeMessage, { type: T }>,
) => void;
