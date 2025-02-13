export type idOSIsleTheme = "light" | "dark";
export type idOSIsleStatus =
  | "disconnected"
  | "no-profile"
  | "not-verified"
  | "pending-verification"
  | "verified"
  | "error";

export type ControllerMessage =
  | {
      type: "initialize";
      data: {
        theme?: idOSIsleTheme;
      };
    }
  | {
      type: "update";
      data: {
        theme?: idOSIsleTheme;
        status?: idOSIsleStatus;
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
    };
