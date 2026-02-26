import {
  verifySignature,
  type WalletSignature,
} from "@idos-network/kwil-infra/signature-verification";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import invariant from "tiny-invariant";
import { Button } from "@/components/ui/button";
import { useAddWalletMutation } from "@/lib/mutations/wallets";
import { dashboardActor } from "@/machines/dashboard.actor";
import { selectWalletAddress, selectWalletType } from "@/machines/selectors";

function parseEmbeddedWalletEnv(): { popupUrl: string; allowedOrigins: string[] } {
  const envUrls = import.meta.env.VITE_EMBEDDED_WALLET_APP_URLS;
  console.log("envUrls: ", envUrls);
  invariant(envUrls && typeof envUrls === "string", "VITE_EMBEDDED_WALLET_APP_URLS is not set");
  const entries = envUrls
    .split(",")
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
  const [walletPayload, setWalletPayload] = useState<WalletSignature | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const addWalletMutation = useAddWalletMutation();
  const queryClient = useQueryClient();

  const addWallet = async (walletPayload: WalletSignature) => {
    const isValid = await verifySignature(walletPayload);
    if (!isValid) {
      toast.error("Invalid signature", {
        description: "The signature does not match the wallet address",
      });
      setIsLoading(false);
      return;
    }
    addWalletMutation.mutate(
      {
        address: walletPayload.address || "unknown",
        publicKeys: walletPayload.public_key ?? [],
        signature: walletPayload.signature,
        message: walletPayload.message || "Sign this message to prove you own this wallet",
        walletType: walletPayload.wallet_type,
      },
      {
        onSuccess: async () => {
          toast.success("Wallet added", {
            description: "The wallet has been added to your idOS profile",
          });
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

  useEffect(() => {
    const abortController = new AbortController();

    const handleMessage = (event: MessageEvent) => {
      if (!EMBEDDED_WALLET_CONFIG.allowedOrigins.includes(event.origin)) {
        console.warn(
          `Rejected message from unauthorized origin: ${event.origin}. Expected one of: ${EMBEDDED_WALLET_CONFIG.allowedOrigins.join(", ")}`,
        );
        return;
      }
      if (event.data?.type === "WALLET_SIGNATURE") {
        setWalletPayload(event.data.data);
        setIsLoading(false);
      }
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
        setIsLoading(false);
        setPopupWindow(null);
        clearInterval(checkPopupClosed);
      }
    }, 1000);

    return () => {
      clearInterval(checkPopupClosed);
    };
  }, [popupWindow]);

  useEffect(() => {
    if (!walletPayload) {
      return;
    }
    addWallet(walletPayload);
  }, [walletPayload]);

  const handleOpenWalletPopup = () => {
    setIsLoading(true);

    // Calculate center position for the popup
    const popupWidth = 400;
    const popupHeight = 620;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;

    // If the dashboard is connected via Stellar, pass the address so the
    // embedded wallet can ensure the user switches back before closing.
    const popupUrl = new URL(EMBEDDED_WALLET_CONFIG.popupUrl);
    const snapshot = dashboardActor.getSnapshot();
    const currentWalletType = selectWalletType(snapshot);
    const currentWalletAddress = selectWalletAddress(snapshot);
    if (currentWalletType === "Stellar" && currentWalletAddress) {
      popupUrl.searchParams.set("stellar_address", currentWalletAddress);
    }

    const popup = window.open(
      popupUrl.toString(),
      "wallet-connection",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=no`,
    );

    if (popup) {
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
