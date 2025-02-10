import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { getNearFullAccessPublicKeys, type idOSWallet } from "@idos-network/idos-sdk";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";

import { useIdOS } from "@/core/idos";

type AddWalletProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultWallet?: string;
};

const createWalletFactory = ({
  address,
  public_key,
}: { address: string; public_key?: string }) => ({
  address,
  public_key,
  message: "",
  signature: "",
});

const useAddWalletMutation = () => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<
    // biome-ignore lint/suspicious/noExplicitAny: Will need to be fixed in the future.
    any,
    DefaultError,
    { address: string; publicKeys: string[] },
    { previousWallets: idOSWallet[] }
  >({
    mutationFn: async ({ address, publicKeys }) => {
      const payload = publicKeys.map((public_key) => createWalletFactory({ address, public_key }));

      if (payload.length > 0) return await sdk.data.createMultiple("wallets", payload, true);

      return await sdk.data.create("wallets", createWalletFactory({ address }), true);
    },

    onMutate: async ({ address, publicKeys }) => {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previousWallets = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];

      const wallets = publicKeys.map((public_key) => createWalletFactory({ address, public_key }));
      const payload = wallets.length > 0 ? wallets : [createWalletFactory({ address })];

      queryClient.setQueryData<idOSWallet[]>(["wallets"], (old = []) => [
        ...old,
        ...(payload as idOSWallet[]),
      ]);

      return { previousWallets };
    },
  });
};

export const AddWallet = ({ isOpen, onClose, defaultWallet }: AddWalletProps) => {
  const toast = useToast();

  const isCentered = useBreakpointValue(
    {
      base: false,
      md: true,
    },
    {
      fallback: "base",
    },
  );

  const queryClient = useQueryClient();

  const addWallet = useAddWalletMutation();

  const handleCallbackUrl = () => {
    const callbackUrl = new URLSearchParams(location.search).get("callbackUrl");
    if (callbackUrl) location.href = callbackUrl;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const address = new FormData(form).get("address") as string;
    const address_regexp = /^0x[0-9a-fA-F]{40}$/;
    const address_type = address_regexp.test(address) ? "EVM" : "NEAR";

    let publicKeys: string[] = [];

    if (address_type === "NEAR") {
      publicKeys = (await getNearFullAccessPublicKeys(address)) || [];

      if (!publicKeys.length) {
        toast({
          title: "Error while adding wallet",
          description:
            "This doesn't look like an EVM wallet, and we can't find a `FullAccessKey` for this NEAR address. idOS doesn't support this wallet.",
          position: "bottom-right",
          status: "error",
        });
        return;
      }
    }

    addWallet.mutate(
      { address, publicKeys },
      {
        async onSuccess(data: idOSWallet | idOSWallet[]) {
          const wallets = Array.isArray(data) ? data : [data];

          const cache = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];
          const updated = cache.map((cachedWallet) => {
            if (!cachedWallet.id) {
              const wallet = wallets.find(
                (wallet) =>
                  wallet.address === cachedWallet.address &&
                  wallet.public_key === cachedWallet.public_key,
              );
              return wallet;
            }
            return cachedWallet;
          });
          queryClient.setQueryData<idOSWallet[]>(["wallets"], updated as idOSWallet[]);
          form.reset();
          handleCallbackUrl();
          handleClose();
        },
        async onError(_, __, ctx) {
          console.log(_);

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

  const handleClose = () => {
    addWallet.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{
        base: "full",
        lg: "xl",
      }}
      isCentered={isCentered}
    >
      <ModalOverlay />
      <ModalContent bg="neutral.900" rounded="xl">
        <form name="add-wallet-form" onSubmit={handleSubmit}>
          <ModalHeader>Insert wallet address</ModalHeader>
          <ModalCloseButton onClick={handleClose} />
          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm" htmlFor="address">
                Wallet address
              </FormLabel>
              <Input
                id="address"
                name="address"
                placeholder="Enter address"
                required={true}
                defaultValue={defaultWallet}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              id="add-wallet-form-submit"
              colorScheme="green"
              type="submit"
              isLoading={addWallet.isPending}
            >
              {addWallet.isError ? "Try again" : "Add wallet"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
