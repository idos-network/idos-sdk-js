import { useIdOS } from "@/idOS.provider";
import { Button, HStack, Heading, Text, VStack, useToast } from "@chakra-ui/react";
import * as GemWallet from "@gemwallet/api";
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { getXrpPublicKey, signGemWalletTx } from "@idos-network/core";
import { defineStepper } from "@stepperize/react";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { TokenETH, TokenXRP } from "@web3icons/react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import invariant from "tiny-invariant";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";

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
  const { address: evmWalletAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [signature, setSignature] = useState("");
  const [publicKeys, setPublicKeys] = useState<string[]>([]);
  const [walletToAdd, setWalletToAdd] = useState("");
  const [currentStep, setCurrentStep] = useState("connect");
  const [walletType, setWalletType] = useState<"EVM" | "XRPL">("EVM");
  const addWalletMutation = useAddWalletMutation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const idOSClient = useIdOS();

  useEffect(() => {
    if (currentStep === "connect" && evmWalletAddress) {
      setWalletToAdd(evmWalletAddress);
      setPublicKeys([evmWalletAddress]);
    }
  }, [currentStep, evmWalletAddress]);

  const getAddressType = (address: string) => {
    const evm_regexp = /^0x[0-9a-fA-F]{40}$/;
    const near_regexp = /^[a-zA-Z0-9._-]+\.near$/;
    const xrp_address_regexp = /^r[0-9a-zA-Z]{24,34}$/;
    const stellar_address_regexp = /^[A-Z0-9]{56}$/;

    if (evm_regexp.test(address)) return "EVM";
    if (near_regexp.test(address)) return "NEAR";
    if (xrp_address_regexp.test(address)) return "XRPL";
    if (stellar_address_regexp.test(address)) return "Stellar";
    return "INVALID";
  };

  const getAccount = async (walletType: "EVM" | "XRPL") => {
    if (walletType === "EVM") return await open();

    if (walletType === "XRPL") {
      const result = await getXrpPublicKey(GemWallet);
      invariant(result, "couldn't get XRPL address");
      invariant(idOSClient.state === "logged-in", "idOS client is not logged in");

      const idosWalletAddress = idOSClient.walletIdentifier;
      const { address: connectedAddress } = result;
      if (connectedAddress === idosWalletAddress) {
        toast({
          title: "Error while reconnecting",
          description:
            "You are already connected to this wallet. Please switch to the wallet with idOS profile.",
          position: "bottom-right",
          status: "error",
        });
        throw new Error(
          "You are already connected to this wallet. Please switch to the wallet with idOS profile.",
        );
      }
      if (result?.publicKey) {
        setPublicKeys([result?.publicKey]);
        setWalletToAdd(result?.address);
        return result?.address;
      }
    }
    return null;
  };

  const getPublicKeys = async (walletType: "EVM" | "XRPL"): Promise<string[] | undefined> => {
    // In XRPL case public keys were already been set at getAccount (we don't wanna call it twice since it')
    if (walletType === "XRPL") return publicKeys;
    return;
  };

  const handleConnect = async (walletType: "EVM" | "XRPL") => {
    await disconnectAsync();
    setWalletType(walletType);

    await getAccount(walletType);

    const publicKeys = await getPublicKeys(walletType);
    if (publicKeys) setPublicKeys(publicKeys);
    setCurrentStep("sign");
    stepper.next();
  };

  const getSignature = async (walletType: "EVM" | "XRPL") => {
    let signature = "";
    if (walletType === "EVM") {
      signature = await signMessageAsync({ message, account: evmWalletAddress as `0x${string}` });
    }
    if (walletType === "XRPL") {
      try {
        signature = (await signGemWalletTx(GemWallet, message)) ?? "";
      } catch (error) {
        console.error({ error });
      }
    }
    return signature;
  };

  const handleSignMessage = async () => {
    const signature = await getSignature(walletType);
    setSignature(signature);
    if (!signature) {
      toast({
        title: "Error while signing message",
        description: "An unexpected error. Please try again.",
        position: "bottom-right",
        status: "error",
      });
      return;
    }
    stepper.next();
  };

  const handleReconnect = async () => {
    invariant(idOSClient.state === "logged-in", "idOS client is not logged in");
    const idosWalletType = getAddressType(idOSClient.walletIdentifier);

    if (idosWalletType === "EVM") {
      await disconnectAsync();
      await open();
    }
    if (idosWalletType === "XRPL") {
      const result = await getXrpPublicKey(GemWallet);
      invariant(result?.address, "couldn't get XRPL address");
      invariant(idOSClient.state === "logged-in", "idOS client is not logged in");
      const { address: connectedAddress } = result;
      const idosWalletAddress = idOSClient.walletIdentifier;
      if (connectedAddress !== idosWalletAddress) {
        toast({
          title: "Error while reconnecting",
          description:
            "You are already connected to this wallet. Please switch to the wallet with idOS profile.",
          position: "bottom-right",
          status: "error",
        });
        return;
      }
    }
    setCurrentStep("add");
    stepper.next();
  };

  const handleAddWallet = async () => {
    addWalletMutation.mutate(
      {
        address: walletToAdd,
        publicKeys,
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
          console.error({ __, error: _ });
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
              <Button rightIcon={<TokenETH variant="mono" />} onClick={() => handleConnect("EVM")}>
                Connect an EVM wallet
              </Button>
              <Button rightIcon={<TokenXRP variant="mono" />} onClick={() => handleConnect("XRPL")}>
                Connect an XRPL wallet
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
