import type { idOSCredential } from "@idos-network/credentials";
import type { Wallet as NearWallet } from "@near-wallet-selector/core";
import type { Wallet as EthersWallet, JsonRpcSigner } from "ethers";
import type { CustomKwilSigner } from "../kwil-infra";

export { KwilSigner } from "@idos-network/kwil-js";


/**
 * Stellar wallet interface - duck typing approach to avoid importing full StellarWalletsKit
 */
export interface StellarWallet {
  getAddress(): Promise<{ address: string }>;
  signMessage(message: string): Promise<{ signedMessage: string }>;
}

export type Wallet = EthersWallet | JsonRpcSigner | NearWallet | CustomKwilSigner | StellarWallet;
export type WalletType = "evm" | "near" | "xrpl" | "stellar";

export const CHAIN_TYPES = ["EVM", "NEAR"] as const;
const WALLET_TYPES = ["evm", "near", "xrpl", "stellar"] as const;
export type ChainType = (typeof CHAIN_TYPES)[number];
export type idOSCredentialStatus = "pending" | "contacted" | "approved" | "rejected" | "expired";

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
