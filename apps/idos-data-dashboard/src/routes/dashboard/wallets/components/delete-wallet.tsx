import { useIdOS } from "@/core/idos";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useToast,
} from "@chakra-ui/react";
import type { idOSWallet } from "@idos-network/idos-sdk";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

type DeleteWalletProps = {
  isOpen: boolean;
  wallets: idOSWallet[] | undefined;
  onClose: () => void;
};

type Ctx = { previousWallets: idOSWallet[] };

const useDeleteWalletMutation = () => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<{ id: string }[], DefaultError, idOSWallet[], Ctx>({
    mutationFn: (wallets) =>
      sdk.data.wallets.deleteMultiple(
        wallets.map((wallet) => wallet.id),
        "Delete wallet from idOS",
        true,
      ),
    async onMutate(wallets) {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previousWallets = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];

      queryClient.setQueryData<idOSWallet[]>(["wallets"], (old = []) =>
        old.filter((wallet) => wallet.address !== wallets[0].address),
      );

      return { previousWallets };
    },
  });
};

export const DeleteWallet = ({ isOpen, wallets, onClose }: DeleteWalletProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteWallet = useDeleteWalletMutation();

  const handleClose = () => {
    deleteWallet.reset();
    onClose();
  };

  const handleDeleteWallet = (wallets: idOSWallet[]) => {
    deleteWallet.mutate(wallets, {
      async onSuccess() {
        handleClose();
      },
      async onError(_, __, ctx) {
        queryClient.setQueryData(["wallets"], ctx?.previousWallets);
        toast({
          title: "Error while deleting wallet",
          description: "An unexpected error. Please try again.",
          position: "bottom-right",
          status: "error",
        });
      },
    });
  };

  if (!wallets || wallets.length === 0) return null;

  return (
    <AlertDialog
      isOpen={isOpen}
      size={{
        base: "full",
        lg: "lg",
      }}
      isCentered
      leastDestructiveRef={cancelRef}
      onClose={handleClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent bg="neutral.900" rounded="xl">
          <AlertDialogHeader>Delete wallet</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>Do you want to delete this wallet from the idOS?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              id={`confirm-delete-wallet-${wallets[0].address}`}
              colorScheme="red"
              ml={3}
              onClick={() => handleDeleteWallet(wallets)}
              isLoading={deleteWallet.isPending}
            >
              {deleteWallet.isError ? "Retry" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
