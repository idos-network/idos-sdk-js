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
import { useMutation, type DefaultError, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import type { idOSWallet } from "../types";

type DeleteWalletProps = {
  isOpen: boolean;
  wallet: idOSWallet | null;
  onClose: () => void;
};

const useDeleteWalletMutation = () => {
  const { sdk } = useIdOS();
  return useMutation<{ id: string }, DefaultError, { id: string }>({
    mutationFn: ({ id }) => sdk.data.delete("wallets", id)
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

  const handleDeleteWallet = (id: string) => {
    deleteWallet.mutate(
      { id },
      {
        async onSuccess() {
          handleClose();
          queryClient.invalidateQueries({
            queryKey: ["wallets"]
          });
        },
        async onError() {
          toast({
            title: "Error while deleting wallet",
            description: "An unexpected error. Please try again.",
            position: "bottom-right",
            status: "error"
          });
        }
      }
    );
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
              onClick={() => handleDeleteWallet(wallet.id)}
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
