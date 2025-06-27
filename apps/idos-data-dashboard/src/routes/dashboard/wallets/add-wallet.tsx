import { useIdOS } from "@/idOS.provider";
import { HStack, Heading, Spinner, Text, VStack, chakra, useToast } from "@chakra-ui/react";
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import invariant from "tiny-invariant";

interface WalletSignature {
  address?: string;
  signature: string;
  message?: string;
  [key: string]: unknown;
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

export function Component() {
  const [walletSignature, setWalletSignature] = useState<WalletSignature | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const addWalletMutation = useAddWalletMutation();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const abortController = new AbortController();

    const handleMessage = (event: MessageEvent) => {
      // Validate origin - should be from the embedded-wallet iframe
      const expectedOrigins = ["https://localhost:5173", "https://localhost:5174"];

      if (!expectedOrigins.includes(event.origin)) {
        console.warn("Message from unexpected origin:", event.origin);
        return;
      }

      if (event.data?.type === "WALLET_SIGNATURE") {
        setWalletSignature(event.data.data);
      }
    };

    // Add event listener for postMessage with AbortController
    window.addEventListener("message", handleMessage, { signal: abortController.signal });

    // Cleanup function to abort the controller
    return () => {
      abortController.abort();
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Fine to exclude `addWalletMutation` from the dependency array
  useEffect(() => {
    if (!walletSignature) return;

    addWalletMutation.mutate(
      {
        address: walletSignature.address || "unknown",
        publicKeys: [walletSignature.address || "unknown"],
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
          navigate("/wallets");
        },
        onError: (error) => {
          console.error(error);
        },
      },
    );
  }, [walletSignature]);

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
  };

  const handleIframeError = () => {
    setIsIframeLoading(false);
  };

  return (
    <VStack align="stretch" flex={1} gap={2.5}>
      <HStack
        justifyContent="space-between"
        h={{
          base: 14,
          lg: 20,
        }}
        p={5}
        bg="neutral.900"
        rounded="xl"
      >
        <Heading
          as="h1"
          fontSize={{
            base: "x-large",
            lg: "xx-large",
          }}
        >
          Add wallet
        </Heading>
      </HStack>

      <VStack
        alignItems="center"
        placeContent="center"
        gap={5}
        p={5}
        bg="neutral.900"
        rounded="xl"
        h="100%"
        position="relative"
        overflow="hidden"
      >
        {isIframeLoading ? (
          <VStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="neutral.900"
            zIndex={1}
            justify="center"
            align="center"
            gap={4}
          >
            <Spinner />
            <Text color="neutral.400">Loading wallet connection...</Text>
          </VStack>
        ) : null}
        <chakra.iframe
          src="https://localhost:5173"
          title="Add wallet"
          bg="neutral.900"
          w="100%"
          h="100%"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            opacity: isIframeLoading ? 0 : 1,
            transition: "opacity 0.3s ease-in-out",
          }}
        />
      </VStack>
    </VStack>
  );
}

Component.displayName = "AddWallet";
