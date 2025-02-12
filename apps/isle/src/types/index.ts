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
        theme?: "light" | "dark";
      };
    }
  | {
      type: "theme.update";
      data: {
        theme: "light" | "dark";
      };
    }
  | {
      type: "status.update";
      data: {
        status:
          | "disconnected"
          | "no-profile"
          | "not-verified"
          | "pending-verification"
          | "verified"
          | "error";
      };
    };

export type NodeMessage = {
  type: "initialized";
  data: {
    theme: idOSIsleTheme;
    status: idOSIsleStatus;
  };
};
