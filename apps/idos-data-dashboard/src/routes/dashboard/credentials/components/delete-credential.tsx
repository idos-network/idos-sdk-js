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

import type { idOSCredential } from "../types";

type DeleteCredentialProps = {
  isOpen: boolean;
  credential: idOSCredential | null;
  onClose: () => void;
};

type Ctx = { previousCredentials: idOSCredential[] };

const useDeleteCredentialMutation = () => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, DefaultError, idOSCredential, Ctx>({
    mutationFn: ({ id }) => sdk.data.delete("credentials", id),
    async onMutate({ id }) {
      await queryClient.cancelQueries({ queryKey: ["credentials"] });
      const previousCredentials = queryClient.getQueryData<idOSCredential[]>(["credentials"]) ?? [];
      queryClient.setQueryData<idOSCredential[]>(["credentials"], (old = []) =>
        old.filter((cred) => cred.id !== id)
      );

      return { previousCredentials };
    }
  });
};

export const DeleteCredential = ({ isOpen, credential, onClose }: DeleteCredentialProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteCredential = useDeleteCredentialMutation();

  const handleClose = () => {
    deleteCredential.reset();
    onClose();
  };

  const handleDeleteCredential = (credential: idOSCredential) => {
    deleteCredential.mutate(credential, {
      async onSuccess() {
        handleClose();
      },
      async onError(_, __, ctx) {
        queryClient.setQueryData(["credentials"], ctx?.previousCredentials);
        toast({
          title: "Error while deleting credential",
          description: "An unexpected error. Please try again.",
          position: "bottom-right",
          status: "error"
        });
      }
    });
  };

  if (!credential) return null;

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
          <AlertDialogHeader>Delete credential</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>Do you want to delete this credentail from the idOS?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              onClick={() => handleDeleteCredential(credential)}
              isLoading={deleteCredential.isPending}
            >
              {deleteCredential.isError ? "Retry" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
