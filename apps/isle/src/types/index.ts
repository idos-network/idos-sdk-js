export type idOSIsleTheme = "light" | "dark";
export type idOSIsleStatus =
  | "disconnected"
  | "no-profile"
  | "not-verified"
  | "pending-verification"
  | "verified"
  | "error";

export type WalletConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export type ControllerMessage =
  | {
      type: "initialize";
      data: {
        status: idOSIsleStatus;
        theme?: idOSIsleTheme;
      };
    }
  | {
      type: "update";
      data: {
        theme?: idOSIsleTheme;
        status?: idOSIsleStatus;
      };
    }
  | {
      type: "wallet_state";
      data: {
        status: WalletConnectionStatus;
        address?: string;
        error?: string;
      };
    };

export type NodeMessage =
  | {
      type: "initialized";
      data: {
        theme: idOSIsleTheme;
        status: idOSIsleStatus;
      };
    }
  | {
      type: "updated";
      data: {
        theme?: idOSIsleTheme;
        status?: idOSIsleStatus;
      };
    }
  | {
      type: "connect-wallet";
    }
  | {
      type: "create-key-pair";
    };
