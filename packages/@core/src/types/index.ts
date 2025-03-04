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

// Common status types
export type CommonStatus = "idle" | "pending" | "success" | "error";

// Common metadata for third-party services
export interface ServiceMeta {
  url: string;
  name: string;
  logo: string;
}

// Specific status types
export type CreateDWGStatus = CommonStatus | "verify-identity" | "start-verification";

// Base message data type
export interface MessageData {
  [key: string]: unknown;
}

export interface VerificationData extends ServiceMeta {
  KYCPermissions: string[];
}

export interface PermissionRequestData {
  granteePublicKey: string;
  meta: ServiceMeta;
}

// Message data types
export interface InitializeData extends MessageData {
  theme?: IsleTheme;
}

export interface UpdateData extends MessageData {
  connectionStatus?: IsleConnectionStatus;
  address?: string;
  theme?: IsleTheme;
  status?: IsleStatus;
  accessGrants?: Map<ServiceMeta, { id: string; dataId: string; type: string }[]>;
}

export interface StatusData extends MessageData {
  status: CommonStatus;
}

export interface DWGStatusData extends MessageData {
  status: CreateDWGStatus;
  meta?: VerificationData;
}

export interface RequestPermissionStatusData extends MessageData {
  status: CommonStatus | "request-permission";
  grantee?: PermissionRequestData;
  KYCPermissions?: string[];
}

// Controller Message Types
export type IsleControllerMessage =
  | { type: "initialize"; data: InitializeData }
  | { type: "update"; data: UpdateData }
  | { type: "update-create-profile-status"; data: StatusData }
  | { type: "update-create-dwg-status"; data: DWGStatusData }
  | { type: "update-revoke-permission-status"; data: StatusData }
  | { type: "update-request-permission-status"; data: RequestPermissionStatusData };

// Node Message Types
export type IsleNodeMessage =
  | { type: "initialized"; data: InitializeData }
  | { type: "updated"; data: UpdateData }
  | { type: "connect-wallet" }
  | { type: "link-wallet" }
  | { type: "create-profile" }
  | { type: "request-dwg" }
  | { type: "verify-identity" }
  | { type: "revoke-permission"; data: { id: string } & MessageData };

export type IsleMessageHandler<T extends IsleNodeMessage["type"]> = (
  message: Extract<IsleNodeMessage, { type: T }>,
) => void;
