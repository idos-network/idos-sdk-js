import {
  verifySignature,
  type WalletSignature,
} from "@idos-network/kwil-infra/signature-verification";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import invariant from "tiny-invariant";

import { Button } from "@/components/ui/button";
import { COMMON_ENV } from "@/core/envFlags.common";
import { useIDOSClient } from "@/hooks/idOS";
import { useAddWalletMutation } from "@/lib/mutations/wallets";

import { addWalletMessage, walletSignatureMatchesRequest } from "./add-wallet-message";

function parseEmbeddedWalletEnv(): { popupUrl: string; allowedOrigins: string[] } {
  const entries = COMMON_ENV.EMBEDDED_WALLET_APP_URLS.split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const allowedOrigins: string[] = [];
  let popupUrl: string | undefined;
  for (const entry of entries) {
    try {
      const origin = new URL(entry).origin;
      allowedOrigins.push(origin);
      if (popupUrl === undefined) {
        popupUrl = entry;
      }
    } catch {
      console.warn(
        "[Add wallet] VITE_EMBEDDED_WALLET_APP_URLS contains invalid URL, skipping:",
        entry,
      );
    }
  }
  invariant(
    popupUrl !== undefined && allowedOrigins.length > 0,
    "VITE_EMBEDDED_WALLET_APP_URLS must contain at least one valid URL",
  );
  return { popupUrl, allowedOrigins };
}

const EMBEDDED_WALLET_CONFIG = parseEmbeddedWalletEnv();

interface AddWalletButtonProps {
  onWalletAdded?: () => void;
}

export function AddWalletButton({ onWalletAdded }: AddWalletButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const pendingRequestRef = useRef<{
    requestId: string;
    popup: Window;
    userId: string;
  } | null>(null);
  const idOSClient = useIDOSClient();
  const userIdRef = useRef(idOSClient.user.id);
  const addWalletMutation = useAddWalletMutation();
  const queryClient = useQueryClient();

  const addWallet = async (walletPayload: WalletSignature) => {
    const requestUserId = pendingRequestRef.current?.userId;
    const isValid = await verifySignature(walletPayload);
    if (!isValid) {
      toast.error("Invalid signature", {
        description: "The signature does not match the wallet address",
      });
      setIsLoading(false);
      return;
    }
    if (requestUserId !== userIdRef.current) {
      toast.error("Invalid wallet data", {
        description: "The signature does not match this profile",
      });
      setIsLoading(false);
      return;
    }
    addWalletMutation.mutate(
      {
        address: walletPayload.address || "unknown",
        publicKeys: walletPayload.public_key ?? [],
        signature: walletPayload.signature,
        message: walletPayload.message,
        walletType: walletPayload.wallet_type,
      },
      {
        onSuccess: async () => {
          toast.success("Wallet added", {
            description: "The wallet has been added to your idOS profile",
          });
          setIsLoading(false);
          await queryClient.invalidateQueries({ queryKey: ["wallets"] });
          onWalletAdded?.();
        },
        onError: (error) => {
          console.error(error);
          setIsLoading(false);
          toast.error("Error adding wallet", {
            description: "Failed to add wallet to your idOS profile",
          });
        },
      },
    );
  };

  const addWalletRef = useRef(addWallet);

  useEffect(() => {
    userIdRef.current = idOSClient.user.id;
    addWalletRef.current = addWallet;
  });

  useEffect(() => {
    const abortController = new AbortController();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "WALLET_SIGNATURE") return;

      const pending = pendingRequestRef.current;
      if (!pending || event.source !== pending.popup) return;

      if (!EMBEDDED_WALLET_CONFIG.allowedOrigins.includes(event.origin)) {
        console.warn(
          `Rejected WALLET_SIGNATURE from unauthorized origin: ${event.origin}. Expected one of: ${EMBEDDED_WALLET_CONFIG.allowedOrigins.join(", ")}`,
        );
        return;
      }

      const payload = event.data.data;
      if (
        !payload?.message ||
        !walletSignatureMatchesRequest(payload.message, pending.userId, pending.requestId)
      ) {
        toast.error("Invalid wallet data", {
          description: "The signature does not match this profile",
        });
        setIsLoading(false);
        return;
      }

      void addWalletRef.current(payload);
    };

    window.addEventListener("message", handleMessage, { signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!popupWindow) {
      return;
    }

    const checkPopupClosed = setInterval(() => {
      if (popupWindow.closed) {
        if (pendingRequestRef.current?.popup === popupWindow) {
          pendingRequestRef.current = null;
        }
        setIsLoading(false);
        setPopupWindow(null);
        clearInterval(checkPopupClosed);
      }
    }, 1000);

    return () => {
      clearInterval(checkPopupClosed);
    };
  }, [popupWindow]);

  const handleOpenWalletPopup = () => {
    setIsLoading(true);

    // Calculate center position for the popup
    const popupWidth = 520;
    const popupHeight = 620;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;

    const requestId = crypto.randomUUID();
    const url = new URL(EMBEDDED_WALLET_CONFIG.popupUrl);
    url.searchParams.set("user_id", idOSClient.user.id);
    url.searchParams.set("request_id", requestId);
    url.searchParams.set("message", addWalletMessage(idOSClient.user.id, requestId));

    pendingRequestRef.current?.popup.close();

    const popup = window.open(
      url.href,
      `wallet-${requestId}`,
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=no`,
    );

    if (popup) {
      pendingRequestRef.current = { requestId, popup, userId: idOSClient.user.id };
      setPopupWindow(popup);

      if (popup.closed || typeof popup.closed === "undefined") {
        toast.error("Popup blocked", {
          description: "Please allow popups for this site to connect your wallet",
        });
        setIsLoading(false);
      }
    } else {
      toast.error("Popup blocked", {
        description: "Please allow popups for this site to connect your wallet",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleOpenWalletPopup} isLoading={isLoading}>
      <PlusIcon size={24} />
      <span className="sr-only md:not-sr-only">Add wallet</span>
    </Button>
  );
}
