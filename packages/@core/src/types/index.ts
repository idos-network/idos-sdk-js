import type { idOSCredential } from "@idos-network/credentials";
import type { Wallet as NearWallet } from "@near-wallet-selector/core";
import type { Wallet as EthersWallet, JsonRpcSigner } from "ethers";
import type { CustomKwilSigner } from "../kwil-infra";

export { KwilSigner } from "@kwilteam/kwil-js";
export type Wallet = EthersWallet | JsonRpcSigner | NearWallet | CustomKwilSigner;

export const CHAIN_TYPES = ["EVM", "NEAR"] as const;
export type ChainType = (typeof CHAIN_TYPES)[number];
export type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

import { z } from "zod";

// Zod schemas
export const idOSUserSchema: z.ZodObject<{
  id: z.ZodString;
  recipient_encryption_public_key: z.ZodString;
}> = z.object({
  id: z.string(),
  recipient_encryption_public_key: z.string(),
});

export const idOSWalletSchema: z.ZodObject<{
  id: z.ZodString;
  user_id: z.ZodString;
  address: z.ZodString;
  wallet_type: z.ZodString;
  message: z.ZodString;
  public_key: z.ZodString;
  signature: z.ZodString;
}> = z.object({
  id: z.string(),
  user_id: z.string(),
  address: z.string(),
  wallet_type: z.string(),
  message: z.string(),
  public_key: z.string(),
  signature: z.string(),
});

export const idOSUserAttributeSchema: z.ZodObject<{
  id: z.ZodString;
  attribute_key: z.ZodString;
  value: z.ZodString;
  user_id: z.ZodOptional<z.ZodString>;
}> = z.object({
  id: z.string(),
  attribute_key: z.string(),
  value: z.string(),
  user_id: z.string().optional(),
});

export const idOSGrantSchema: z.ZodObject<{
  id: z.ZodString;
  ag_owner_user_id: z.ZodString;
  ag_grantee_wallet_identifier: z.ZodString;
  data_id: z.ZodString;
  locked_until: z.ZodString;
  content_hash: z.ZodOptional<z.ZodString>;
  inserter_id: z.ZodOptional<z.ZodString>;
  inserter_type: z.ZodOptional<z.ZodString>;
}> = z.object({
  id: z.string(),
  ag_owner_user_id: z.string(),
  ag_grantee_wallet_identifier: z.string(),
  data_id: z.string(),
  locked_until: z.string(),
  content_hash: z.string().optional(),
  inserter_id: z.string().optional(),
  inserter_type: z.string().optional(),
});

export const DelegatedWriteGrantSchema: z.ZodObject<{
  owner_wallet_identifier: z.ZodString;
  grantee_wallet_identifier: z.ZodString;
  issuer_public_key: z.ZodString;
  id: z.ZodString;
  access_grant_timelock: z.ZodString;
  not_usable_before: z.ZodString;
  not_usable_after: z.ZodString;
}> = z.object({
  owner_wallet_identifier: z.string(),
  grantee_wallet_identifier: z.string(),
  issuer_public_key: z.string(),
  id: z.string(),
  access_grant_timelock: z.string(),
  not_usable_before: z.string(),
  not_usable_after: z.string(),
});

// Inferred types from Zod schemas
export type idOSUser = z.infer<typeof idOSUserSchema>;
export type idOSWallet = z.infer<typeof idOSWalletSchema>;
export type idOSUserAttribute = z.infer<typeof idOSUserAttributeSchema>;
export type idOSGrant = z.infer<typeof idOSGrantSchema>;
export type DelegatedWriteGrant = z.infer<typeof DelegatedWriteGrantSchema>;

/**
 * Following types are specific to the isle `postMessage` protocol.
 * Do not stress much about them, they will be refactored in the future once the idOS Isle is fully integrated.
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
          consumerAuthPublicKey: string;
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
      type: "update-dimensions";
      data: {
        width: number;
        height: number;
      };
    };

export type IsleMessageHandler<T extends IsleNodeMessage["type"]> = (
  message: Extract<IsleNodeMessage, { type: T }>,
) => void;

export type PassportingPeer = {
  id: string;
  name: string;
  issuer_public_key: string;
  passporting_server_url_base: string;
};

export type PassportingClub = {
  id: string;
  name: string;
};
