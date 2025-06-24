import { useIdOS } from "@/idOS.provider";
import { Button, HStack, Heading, Text, VStack, useToast } from "@chakra-ui/react";
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { defineStepper } from "@stepperize/react";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { TokenETH } from "@web3icons/react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import invariant from "tiny-invariant";
import { useAccountEffect, useDisconnect, useSignMessage } from "wagmi";

const message = "Please sign this message to add this wallet to your idOS account.";

const { useStepper } = defineStepper(
  {
    id: "connect",
    title: "Connect the wallet you want to add",
    description: "Please connect with the wallet you want to add",
  },
  {
    id: "sign",
    title: "Sign a message",
    description: "Please sign a message to add this wallet to your idOS account",
  },
  {
    id: "reconnect",
    title: "Reconnect with your idOS profile",
    description: "Please reconnect with your idOS profile",
  },
  {
    id: "add",
    title: "Add the wallet to your idOS account",
    description: "Please add the wallet to your idOS account",
  },
);

const createWalletParamsFactory = ({
  address,
  public_key,
  signature,
  message,
}: { address: string; public_key?: string; signature?: string; message: string }) => ({
  id: crypto.randomUUID() as string,
  address,
  public_key: public_key ?? null,
  message,
  signature: signature ?? "",
});

const createWallet = async (
  idOSClient: idOSClientLoggedIn,
  params: { address: string; public_key?: string; signature?: string; message: string },
): Promise<idOSWallet> => {
  const walletParams = createWalletParamsFactory(params);
  await idOSClient.addWallet(walletParams);

  const insertedWallet = (await idOSClient.getWallets()).find((w) => w.id === walletParams.id);
  invariant(insertedWallet, "insertedWallet is undefined, idOSClient.addWallet must have failed");

  return insertedWallet;
};

const useAddWalletMutation = () => {
  const idOSClient = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<
    // biome-ignore lint/suspicious/noExplicitAny: Will need to be fixed in the future.
    any,
    DefaultError,
    { address: string; publicKeys: string[]; signature: string; message: string },
    { previousWallets: idOSWallet[] }
  >({
    mutationFn: async ({ address, publicKeys, signature, message }) => {
      // Ensure the client is logged in
      if (idOSClient.state !== "logged-in") {
        throw new Error("idOS client is not logged in");
      }

      if (publicKeys.length > 0) {
        return Promise.all(
          publicKeys.map((public_key) =>
            createWallet(idOSClient, { address, public_key, signature, message }),
          ),
        );
      }
      return [await createWallet(idOSClient, { address, message, signature })];
    },

    onMutate: async ({ address, publicKeys, signature, message }) => {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previousWallets = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];

      const wallets = publicKeys.map((public_key) =>
        createWalletParamsFactory({ address, public_key, signature, message }),
      );
      const payload =
        wallets.length > 0 ? wallets : [createWalletParamsFactory({ address, signature, message })];

      queryClient.setQueryData<idOSWallet[]>(["wallets"], (old = []) => [
        ...old,
        ...(payload as idOSWallet[]),
      ]);

      return { previousWallets };
    },
  });
};

export function Component() {
  const stepper = useStepper();
  const { open } = useWeb3Modal();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [signature, setSignature] = useState("");
  const [walletToAdd, setWalletToAdd] = useState("");
  const [currentStep, setCurrentStep] = useState("connect");
  const addWalletMutation = useAddWalletMutation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();

  useAccountEffect({
    onConnect: (account) => {
      const address = account.addresses[account.addresses.length - 1];

      if (currentStep === "connect") {
        setWalletToAdd(address);
        setCurrentStep("sign");
        stepper.next();
      } else if (currentStep === "reconnect") {
        setCurrentStep("add");
        stepper.next();
      }
    },
  });

  const handleConnect = async () => {
    await disconnectAsync();
    await open();
  };

  const handleSignMessage = async () => {
    const signature = await signMessageAsync({ message, account: walletToAdd as `0x${string}` });
    setSignature(signature);
    setCurrentStep("reconnect");
    stepper.next();
  };

  const handleReconnect = async () => {
    await disconnectAsync();
    await open();
  };

  const handleAddWallet = async () => {
    addWalletMutation.mutate(
      {
        address: walletToAdd,
        publicKeys: [walletToAdd], // For EVM wallets, pass the address as public key
        signature,
        message,
      },
      {
        async onSuccess() {
          queryClient.invalidateQueries({ queryKey: ["wallets"] });
          navigate("/wallets");
        },
        async onError(_, __, ctx) {
          queryClient.setQueryData(["wallets"], ctx?.previousWallets);
          toast({
            title: "Error while adding wallet",
            description: "An unexpected error. Please try again.",
            position: "bottom-right",
            status: "error",
          });
        },
      },
    );
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
        <HStack>
          <Heading
            as="h1"
            fontSize={{
              base: "x-large",
              lg: "xx-large",
            }}
          >
            Add New Wallet
          </Heading>
        </HStack>
      </HStack>
      <VStack p={5} h="full" alignItems="center" placeContent="center">
        <VStack gap="4" bg="neutral.900" rounded="xl" p={5}>
          {stepper.when("connect", (step) => (
            <>
              <Heading as="h2" size="md">
                {step.title}
              </Heading>
              <Text>{step.description}</Text>
              <Button rightIcon={<TokenETH variant="mono" />} onClick={handleConnect}>
                Connect an EVM wallet
              </Button>
            </>
          ))}

          {stepper.when("sign", (step) => (
            <>
              <Heading as="h2" size="md">
                {step.title}
              </Heading>
              <Text>{step.description}</Text>
              {walletToAdd && (
                <Text fontSize="sm" color="gray.400">
                  Wallet: {walletToAdd}
                </Text>
              )}
              <Button onClick={handleSignMessage}>Sign a message</Button>
            </>
          ))}

          {stepper.when("reconnect", (step) => (
            <>
              <Heading as="h2" size="md">
                {step.title}
              </Heading>
              <Text>{step.description}</Text>
              {walletToAdd && (
                <Text fontSize="sm" color="gray.400">
                  Adding wallet: {walletToAdd}
                </Text>
              )}
              <Button onClick={handleReconnect}>Reconnect with your idOS profile</Button>
            </>
          ))}

          {stepper.when("add", (step) => (
            <>
              <Heading as="h2" size="md">
                {step.title}
              </Heading>
              <Text>{step.description}</Text>
              {walletToAdd && (
                <Text fontSize="sm" color="gray.400">
                  Adding wallet: {walletToAdd}
                </Text>
              )}
              <Button onClick={handleAddWallet}>Add the wallet to your idOS account</Button>
            </>
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
}

Component.displayName = "AddWallet";
