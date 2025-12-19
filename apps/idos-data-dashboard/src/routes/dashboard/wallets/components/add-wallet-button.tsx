import {
  Button,
  Center,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useBreakpointValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { verifySignature, type WalletSignature } from "@idos-network/core/signature-verification";
import { getWalletType } from "@idos-network/core/utils";
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
  userId,
  walletType,
}: {
  address: string;
  public_key?: string;
  signature: string;
  message: string;
  userId: string;
  walletType: string;
}) => ({
  id: crypto.randomUUID() as string,
  address,
  public_key: public_key ?? null,
  message,
  signature,
  user_id: userId,
  wallet_type: walletType,
});

const createWallet = async (
  idOSClient: idOSClientLoggedIn,
  params: {
    address: string;
    public_key?: string;
    signature: string;
    message: string;
    userId: string;
    walletType: string;
  },
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
    {
      address: string;
      publicKeys: string[];
      signature: string;
      message: string;
      walletType: string;
      userId: string;
    }
  >({
    mutationFn: async ({ address, publicKeys, signature, message, walletType, userId }) => {
      if (publicKeys.length > 0) {
        return Promise.all(
          publicKeys.map((public_key) =>
            createWallet(idOSClient, {
              address,
              public_key,
              signature,
              message,
              userId,
              walletType,
            }),
          ),
        );
      }
      return [await createWallet(idOSClient, { address, signature, message, userId, walletType })];
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
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const addWalletMutation = useAddWalletMutation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isMobile = useBreakpointValue({ base: true, lg: false }, { ssr: false }) ?? false;
  const idOSClient = useIdOS();

  const addWallet = async (walletPayload: WalletSignature) => {
    const userId = idOSClient?.user.id;

    const isValid = await verifySignature(walletPayload);
    const walletType = getWalletType(walletPayload.address!);

    invariant(userId, "userId is not set, please login first");
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
        walletType,
        userId,
      },
      {
        onSuccess: async () => {
          toast({
            title: "Wallet added",
            description: "The wallet has been added to your idOS profile",
          });
          await queryClient.invalidateQueries({ queryKey: ["wallets"] });
          onWalletAdded?.();
          // Close modal if open (mobile)
          if (isModalOpen) {
            onModalClose();
          }
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
      // Only accept messages from the wallet connector app
      const allowedOrigin = import.meta.env.VITE_EMBEDDED_WALLET_APP_URL;
      if (!allowedOrigin) {
        console.warn("VITE_EMBEDDED_WALLET_APP_URL is not configured");
        return;
      }

      // Extract origin from the full URL
      const allowedOriginUrl = new URL(allowedOrigin);
      const allowedOriginString = allowedOriginUrl.origin;

      // Debug logging
      console.log("Message received:", {
        origin: event.origin,
        expectedOrigin: allowedOriginString,
        messageType: event.data?.type,
        data: event.data,
      });

      if (event.origin !== allowedOriginString) {
        console.warn(
          `Rejected message from unauthorized origin: ${event.origin}. Expected: ${allowedOriginString}`,
        );
        return;
      }

      // Handle messages from wallet-connector app
      if (event.data?.type === "idOS_WALLET_CONNECTOR:MESSAGE_SIGNED") {
        const payload = event.data.payload;
        // Map the payload to WalletSignature format
        setWalletPayload({
          address: payload.address,
          signature: payload.signature,
          public_key: payload.public_key || [],
          message: payload.message,
        });
        setIsLoading(false);
        // Close modal if open (mobile)
        if (isModalOpen) {
          onModalClose();
        }
      }
      // Also handle legacy WALLET_SIGNATURE format for backward compatibility
      else if (event.data?.type === "WALLET_SIGNATURE") {
        setWalletPayload(event.data.data);
        setIsLoading(false);
        // Close modal if open (mobile)
        if (isModalOpen) {
          onModalClose();
        }
      }
    };

    window.addEventListener("message", handleMessage, { signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [isModalOpen]);

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

  const handleOpenWalletModal = () => {
    invariant(
      import.meta.env.VITE_EMBEDDED_WALLET_APP_URL,
      "VITE_EMBEDDED_WALLET_APP_URL is not set",
    );
    setIsIframeLoading(true);
    setIsLoading(true);
    onModalOpen();
  };

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
  };

  const handleClose = () => {
    setIsLoading(false);
    setIsIframeLoading(true);
    setWalletPayload(null);
    onModalClose();
  };

  const walletConnectorUrl = import.meta.env.VITE_EMBEDDED_WALLET_APP_URL;

  if (isMobile) {
    return (
      <>
        <IconButton
          id="add-wallet-button"
          colorScheme="green"
          aria-label="Add wallet"
          onClick={handleOpenWalletModal}
          isLoading={isLoading}
        >
          <PlusIcon size={24} />
        </IconButton>
        <Modal
          isOpen={isModalOpen}
          onClose={handleClose}
          size={{
            base: "full",
            lg: "xl",
          }}
          isCentered={false}
        >
          <ModalOverlay />
          <ModalContent bg="neutral.900" rounded="xl">
            <ModalHeader>Connect Wallet</ModalHeader>
            <ModalCloseButton />
            <ModalBody p={0} position="relative" display="grid">
              {isIframeLoading && (
                <Center
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  bg="neutral.950"
                  zIndex={1}
                >
                  <Spinner size="xl" color="green.500" />
                </Center>
              )}
              {walletConnectorUrl && (
                <iframe
                  src={walletConnectorUrl}
                  onLoad={handleIframeLoad}
                  style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    minHeight: "600px",
                    border: "none",
                    flex: 1,
                    opacity: isIframeLoading ? 0 : 1,
                    transition: "opacity 0.2s ease-in-out",
                  }}
                  title="Wallet Connector"
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <Button
      id="add-wallet-button"
      colorScheme="green"
      leftIcon={<PlusIcon size={24} />}
      onClick={handleOpenWalletPopup}
      isLoading={isLoading}
    >
      Add wallet
    </Button>
  );
}
