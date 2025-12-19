import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type WalletPayload = {
  address: string;
  signature: string;
  public_key: string[];
  message: string;
};

export type PostMessageEvent = {
  type: "idOS_WALLET_CONNECTOR:MESSAGE_SIGNED";
  payload: WalletPayload;
};

export function sendToParent(event: PostMessageEvent) {
  const targetOrigin = import.meta.env.VITE_APP_PARENT_ORIGIN;
  if (!targetOrigin) {
    throw new Error("`VITE_APP_PARENT_ORIGIN` is not set");
  }

  // Check if we're in an iframe
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(event, targetOrigin);
  }
  // Check if we're in a popup window
  else if (window.opener && !window.opener.closed) {
    window.opener.postMessage(event, targetOrigin);
  } else {
    console.warn("No parent window or opener found to send message to");
  }
}

/**
 * Closes the window if it's a popup. Should be called after disconnect completes.
 */
export function closeWindowIfPopup() {
  // Only close if we're in a popup window (not an iframe)
  if (window.opener && !window.opener.closed && (!window.parent || window.parent === window)) {
    window.close();
  }
}
