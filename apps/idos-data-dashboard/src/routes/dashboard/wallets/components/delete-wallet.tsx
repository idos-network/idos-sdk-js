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
  useToast
} from "@chakra-ui/react";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import type { idOSWallet } from "../types";

type DeleteWalletProps = {
  isOpen: boolean;
  wallet: idOSWallet | null;
  onClose: () => void;
};

type Ctx = { previousWallets: idOSWallet[] };

const useDeleteWalletMutation = () => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, DefaultError, idOSWallet, Ctx>({
    mutationFn: ({ id }) => sdk.data.delete("wallets", id),
    async onMutate({ address }) {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previousWallets = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];
      queryClient.setQueryData<idOSWallet[]>(["wallets"], (old = []) =>
        old.filter((wallet) => wallet.address !== address)
      );

      return { previousWallets };
    }
  });
};

export const DeleteWallet = ({ isOpen, wallet, onClose }: DeleteWalletProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteWallet = useDeleteWalletMutation();

  const handleClose = () => {
    deleteWallet.reset();
    onClose();
  };

  const handleDeleteWallet = (wallet: idOSWallet) => {
    deleteWallet.mutate(wallet, {
      async onSuccess() {
        handleClose();
      },
      async onError(_, __, ctx) {
        queryClient.setQueryData(["wallets"], ctx?.previousWallets);
        toast({
          title: "Error while deleting wallet",
          description: "An unexpected error. Please try again.",
          position: "bottom-right",
          status: "error"
        });
      }
    });
  };

  if (!wallet) return null;

  return (
    <AlertDialog
      isOpen={isOpen}
      size={{
        base: "full",
        lg: "lg"
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
              colorScheme="red"
              ml={3}
              onClick={() => handleDeleteWallet(wallet)}
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
