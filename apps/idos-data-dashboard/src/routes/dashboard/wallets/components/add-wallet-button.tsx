import { Button, IconButton, useToast } from "@chakra-ui/react";
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useIdOS } from "@/idOS.provider";
import invariant from "tiny-invariant";

interface WalletSignature {
  address?: string;
  signature: string;
  message?: string;
  public_key: string[];
}

const createWalletParamsFactory = ({
  address,
  public_key,
  signature,
  message,
}: { address: string; public_key?: string; signature: string; message: string }) => ({
  id: crypto.randomUUID() as string,
  address,
  public_key: public_key ?? null,
  message,
  signature,
});

const createWallet = async (
  idOSClient: idOSClientLoggedIn,
  params: { address: string; public_key?: string; signature: string; message: string },
): Promise<idOSWallet> => {
  const walletParams = createWalletParamsFactory(params);
  await idOSClient.addWallet(walletParams);

  const insertedWallet = (await idOSClient.getWallets()).find((w) => w.id === walletParams.id);
  invariant(
    insertedWallet,
    "`insertedWallet` is `undefined`, `idOSClient.addWallet` must have failed",
  );

  return insertedWallet;
};

const useAddWalletMutation = () => {
  const idOSClient = useIdOS();

  return useMutation<
    idOSWallet[],
    DefaultError,
    { address: string; publicKeys: string[]; signature: string; message: string }
  >({
    mutationFn: async ({ address, publicKeys, signature, message }) => {
      if (publicKeys.length > 0) {
        return Promise.all(
          publicKeys.map((public_key) =>
            createWallet(idOSClient, { address, public_key, signature, message }),
          ),
        );
      }
      return [await createWallet(idOSClient, { address, signature, message })];
    },
  });
};

interface AddWalletButtonProps {
  variant?: "button" | "icon";
  onWalletAdded?: () => void;
}

export function AddWalletButton({ variant = "button", onWalletAdded }: AddWalletButtonProps) {
  const [walletSignature, setWalletSignature] = useState<WalletSignature | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const addWalletMutation = useAddWalletMutation();
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const abortController = new AbortController();

    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event.data);
      console.log("Message origin:", event.origin);

      // Accept messages from any origin for now
      if (event.data?.type === "WALLET_SIGNATURE") {
        console.log("Processing wallet signature:", event.data.data);
        setWalletSignature(event.data.data);
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage, { signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!popupWindow) return;

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!walletSignature) return;

    addWalletMutation.mutate(
      {
        address: walletSignature.address || "unknown",
        publicKeys: walletSignature.public_key || [],
        signature: walletSignature.signature,
        message: walletSignature.message || "Sign this message to prove you own this wallet",
      },
      {
        onSuccess: async () => {
          toast({
            title: "Wallet added",
            description: "The wallet has been added to your idOS profile",
          });
          await queryClient.invalidateQueries({ queryKey: ["wallets"] });
          onWalletAdded?.();
        },
        onError: (error) => {
          console.error(error);
          setIsLoading(false);
          toast({
            title: "Error adding wallet",
            description: "Failed to add wallet to your idOS profile",
            status: "error",
          });
        },
      },
    );
  }, [walletSignature]);

  const handleOpenWalletPopup = () => {
    setIsLoading(true);

    // Calculate center position for the popup
    const popupWidth = 500;
    const popupHeight = 600;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;

    const popup = window.open(
      "https://localhost:5174",
      "wallet-connection",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`,
    );

    if (popup) {
      setPopupWindow(popup);

      if (popup.closed || typeof popup.closed === "undefined") {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to connect your wallet",
          status: "error",
        });
        setIsLoading(false);
      }
    } else {
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site to connect your wallet",
        status: "error",
      });
      setIsLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <IconButton
        aria-label="Add wallet"
        colorScheme="green"
        icon={<PlusIcon size={24} />}
        hideFrom="lg"
        onClick={handleOpenWalletPopup}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Button
      id="add-wallet-button"
      colorScheme="green"
      leftIcon={<PlusIcon size={24} />}
      hideBelow="lg"
      onClick={handleOpenWalletPopup}
      isLoading={isLoading}
    >
      Add wallet
    </Button>
  );
}
