import { WALLET_TYPES, type WalletType } from "@idos-network/kwil-infra/actions";
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

import { beginAddWalletAttempt, type AddWalletAttempt } from "./add-wallet-attempt";

const WALLET_SIGNATURE_TTL_MS = 15 * 60 * 1000;

function isWalletType(value: unknown): value is WalletType {
  return typeof value === "string" && (WALLET_TYPES as readonly string[]).includes(value);
}

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
    attempt: AddWalletAttempt | null;
    chain: {
      address: string;
      walletType: WalletType;
      message: string;
      notBefore: string;
      notAfter: string;
    } | null;
  } | null>(null);
  const idOSClient = useIDOSClient();
  const userIdRef = useRef(idOSClient.user.id);
  const idOSClientRef = useRef(idOSClient);
  const addWalletMutation = useAddWalletMutation();
  const queryClient = useQueryClient();

  const addWallet = async (
    walletPayload: WalletSignature,
    requestUserId: string,
    attemptId: string,
  ) => {
    const isValid = await verifySignature(walletPayload);
    const pending = pendingRequestRef.current;
    if (!pending?.attempt || pending.attempt.id !== attemptId) return;
    if (!isValid) {
      toast.error("Invalid signature", {
        description: "The signature does not match the wallet address",
      });
      setIsLoading(false);
      return;
    }
    if (
      requestUserId !== userIdRef.current ||
      !pending.chain ||
      walletPayload.message !== pending.chain.message ||
      walletPayload.address !== pending.chain.address ||
      walletPayload.wallet_type !== pending.chain.walletType
    ) {
      toast.error("Invalid wallet data", {
        description: "The signature does not match this profile",
      });
      setIsLoading(false);
      return;
    }
    const { notBefore, notAfter } = pending.chain;
    pendingRequestRef.current = null;
    addWalletMutation.mutate(
      {
        address: walletPayload.address || "unknown",
        publicKeys: walletPayload.public_key ?? [],
        signature: walletPayload.signature,
        notBefore,
        notAfter,
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
    idOSClientRef.current = idOSClient;
    addWalletRef.current = addWallet;
  });

  useEffect(() => {
    const abortController = new AbortController();

    const handleMessage = (event: MessageEvent) => {
      const pending = pendingRequestRef.current;
      if (!pending || event.source !== pending.popup) return;
      if (!EMBEDDED_WALLET_CONFIG.allowedOrigins.includes(event.origin)) {
        console.warn(
          `Rejected wallet message from unauthorized origin: ${event.origin}. Expected one of: ${EMBEDDED_WALLET_CONFIG.allowedOrigins.join(", ")}`,
        );
        return;
      }

      if (event.data?.type === "WALLET_READY") {
        void issueChainMessage(event, pending);
        return;
      }

      if (event.data?.type !== "WALLET_SIGNATURE") return;

      const payload = event.data.data;
      if (typeof payload?.attemptId !== "string" || payload.attemptId !== pending.attempt?.id) {
        return;
      }
      if (!payload.message || !pending.chain || payload.message !== pending.chain.message) {
        toast.error("Invalid wallet data", {
          description: "The signature does not match this profile",
        });
        setIsLoading(false);
        return;
      }

      void addWalletRef.current(payload, pending.userId, payload.attemptId);
    };

    const issueChainMessage = async (
      event: MessageEvent,
      pending: NonNullable<typeof pendingRequestRef.current>,
    ) => {
      const { requestId, userId, attemptId, address, walletType } = event.data as {
        requestId?: unknown;
        userId?: unknown;
        attemptId?: unknown;
        address?: unknown;
        walletType?: unknown;
      };
      if (
        requestId !== pending.requestId ||
        userId !== pending.userId ||
        typeof attemptId !== "string" ||
        attemptId.length === 0 ||
        typeof address !== "string" ||
        address.length === 0 ||
        !isWalletType(walletType)
      ) {
        toast.error("Invalid wallet data", {
          description: "The signature does not match this profile",
        });
        setIsLoading(false);
        return;
      }

      const notBeforeDate = new Date();
      const notBefore = notBeforeDate.toISOString();
      const notAfter = new Date(notBeforeDate.getTime() + WALLET_SIGNATURE_TTL_MS).toISOString();
      const started = beginAddWalletAttempt(pending.attempt, {
        id: attemptId,
        address,
        walletType,
      });
      if (started.dropChain) pending.chain = null;
      pending.attempt = started.attempt;
      try {
        const message = await idOSClientRef.current.addWalletMessage({
          address,
          wallet_type: walletType,
          user_id: pending.userId,
          not_before: notBefore,
          not_after: notAfter,
        });
        if (pendingRequestRef.current !== pending || pending.attempt?.id !== attemptId) return;
        pending.chain = { address, walletType, message, notBefore, notAfter };
        pending.popup.postMessage(
          {
            type: "SIGN_ADD_WALLET",
            requestId: pending.requestId,
            attemptId,
            message,
            notBefore,
            notAfter,
          },
          event.origin,
        );
      } catch (error) {
        console.error(error);
        if (pendingRequestRef.current === pending && pending.attempt?.id === attemptId) {
          pendingRequestRef.current = null;
        } else {
          return;
        }
        setIsLoading(false);
        toast.error("Error adding wallet", {
          description: "Failed to prepare the wallet signature",
        });
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

    pendingRequestRef.current?.popup.close();

    const popup = window.open(
      url.href,
      `wallet-${requestId}`,
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=no`,
    );

    if (popup) {
      pendingRequestRef.current = {
        requestId,
        popup,
        userId: idOSClient.user.id,
        attempt: null,
        chain: null,
      };
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
