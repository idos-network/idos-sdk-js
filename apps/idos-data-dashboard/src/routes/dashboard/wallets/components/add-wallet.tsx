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
import type { idOSClientLoggedIn, idOSWallet } from "@idos-network/client";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";

import { useIdOS } from "@/idOS.provider";
import { getNearFullAccessPublicKeys } from "@/utils/near";
import invariant from "tiny-invariant";

type AddWalletProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultValue?: string;
  onWalletAdded: () => void;
};

const createWalletParamsFactory = ({
  address,
  public_key,
}: { address: string; public_key?: string }) => ({
  id: crypto.randomUUID() as string,
  address,
  public_key: public_key ?? null,
  message: "",
  signature: "",
});

const createWallet = async (
  idOSClient: idOSClientLoggedIn,
  params: { address: string; public_key?: string },
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
    { address: string; publicKeys: string[] },
    { previousWallets: idOSWallet[] }
  >({
    mutationFn: async ({ address, publicKeys }) => {
      if (publicKeys.length > 0) {
        return Promise.all(
          publicKeys.map((public_key) => createWallet(idOSClient, { address, public_key })),
        );
      }
      return [await createWallet(idOSClient, { address })];
    },

    onMutate: async ({ address, publicKeys }) => {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previousWallets = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];

      const wallets = publicKeys.map((public_key) =>
        createWalletParamsFactory({ address, public_key }),
      );
      const payload = wallets.length > 0 ? wallets : [createWalletParamsFactory({ address })];

      queryClient.setQueryData<idOSWallet[]>(["wallets"], (old = []) => [
        ...old,
        ...(payload as idOSWallet[]),
      ]);

      return { previousWallets };
    },
  });
};

export const AddWallet = ({ isOpen, onClose, defaultValue, onWalletAdded }: AddWalletProps) => {
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const address = new FormData(form).get("address") as string;
    const address_regexp = /^0x[0-9a-fA-F]{40}$/;
    const address_type = address_regexp.test(address) ? "EVM" : "NEAR";

    let publicKeys: string[] = [];

    if (address_type === "NEAR") {
      publicKeys = (await getNearFullAccessPublicKeys(address)) || [];
      console.log(publicKeys);

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
        async onSuccess(wallets: idOSWallet[]) {
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
          handleClose();
          onWalletAdded();
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
                defaultValue={defaultValue}
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
