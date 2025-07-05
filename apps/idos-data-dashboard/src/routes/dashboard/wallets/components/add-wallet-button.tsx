import { Button, IconButton, useBreakpointValue, useToast } from "@chakra-ui/react";
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { verifySignature, type WalletSignature } from "@idos-network/core/signature-verification";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { useIdOS } from "@/idOS.provider";

const createWalletParamsFactory = ({
  address,
  public_key,
  signature,
  message,
}: {
  address: string;
  public_key?: string;
  signature: string;
  message: string;
}) => ({
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
  onWalletAdded?: () => void;
}

export function AddWalletButton({ onWalletAdded }: AddWalletButtonProps) {
  const [walletPayload, setWalletPayload] = useState<WalletSignature | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const addWalletMutation = useAddWalletMutation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isMobile = useBreakpointValue({ base: true, md: false }, { ssr: false }) ?? false;

  const addWallet = async (walletPayload: WalletSignature) => {
    const isValid = await verifySignature(walletPayload);

    if (!isValid) {
      toast({
        title: "Invalid signature",
        description: "The signature does not match the wallet address",
        status: "error",
      });
      setIsLoading(false);
      return;
    }
    addWalletMutation.mutate(
      {
        address: walletPayload.address || "unknown",
        publicKeys: walletPayload.public_key || [],
        signature: walletPayload.signature,
        message: walletPayload.message || "Sign this message to prove you own this wallet",
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
  };

  useEffect(() => {
    const abortController = new AbortController();

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the embedded wallet app
      const allowedOrigin = import.meta.env.VITE_EMBEDDED_WALLET_APP_URL;
      if (!allowedOrigin) {
        console.warn("VITE_EMBEDDED_WALLET_APP_URL is not configured");
        return;
      }

      // Extract origin from the full URL
      const allowedOriginUrl = new URL(allowedOrigin);
      const allowedOriginString = allowedOriginUrl.origin;

      if (event.origin !== allowedOriginString) {
        console.warn(
          `Rejected message from unauthorized origin: ${event.origin}. Expected: ${allowedOriginString}`,
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

  useEffect(() => {
    if (!walletPayload) return;
    addWallet(walletPayload);
  }, [walletPayload]);

  const handleOpenWalletPopup = () => {
    invariant(
      import.meta.env.VITE_EMBEDDED_WALLET_APP_URL,
      "VITE_EMBEDDED_WALLET_APP_URL is not set",
    );

    setIsLoading(true);

    // Calculate center position for the popup
    const popupWidth = 400;
    const popupHeight = 620;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;

    const popup = window.open(
      import.meta.env.VITE_EMBEDDED_WALLET_APP_URL,
      "wallet-connection",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=no`,
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

  if (isMobile) {
    return (
      <IconButton id="add-wallet-button" colorScheme="green" aria-label="Add wallet">
        <PlusIcon size={24} />
      </IconButton>
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
