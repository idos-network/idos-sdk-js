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
      };
    }
  | {
      type: "process-state";
      data: {
        status: "idle" | "pending" | "success" | "error";
        name: string;
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
    };

export type IsleMessageHandler<T extends IsleNodeMessage["type"]> = (
  message: Extract<IsleNodeMessage, { type: T }>,
) => void;
