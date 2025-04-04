import { useIdosClient } from "@/core/idos";
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
import type { idOSWallet } from "@idos-network/core";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import invariant from "tiny-invariant";

type DeleteWalletProps = {
  isOpen: boolean;
  wallets: idOSWallet[] | undefined;
  onClose: () => void;
};

type Ctx = { previousWallets: idOSWallet[] };

const useDeleteWalletMutation = () => {
  const idOSClient = useIdosClient();
  const queryClient = useQueryClient();

  return useMutation<void, DefaultError, idOSWallet[], Ctx>({
    mutationFn: async (wallets) => {
      invariant(idOSClient.state === "logged-in", "idOSClient is not logged in");
      await idOSClient.removeWallets(wallets.map((wallet) => wallet.id));
    },
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
