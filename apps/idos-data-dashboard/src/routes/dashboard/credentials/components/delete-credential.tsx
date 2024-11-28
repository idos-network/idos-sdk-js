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
  Code,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import type { idOSCredential, idOSGrant } from "@idos-network/idos-sdk";
import {
  type DefaultError,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";

import { useFetchGrants, useRevokeGrants } from "../shared";

type DeleteCredentialProps = {
  isOpen: boolean;
  credential: idOSCredential;
  onClose: () => void;
};

type Ctx = { previousCredentials: idOSCredential[] };

const useDeleteCredentialMutation = () => {
  const { sdk } = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, DefaultError, { id: string; credential_type: string }, Ctx>({
    mutationFn: ({ id, credential_type }) =>
      sdk.data.delete("credentials", id, `Delete credential ${credential_type} from idOS`, true),
    async onMutate({ id }) {
      await queryClient.cancelQueries({ queryKey: ["credentials"] });
      const previousCredentials = queryClient.getQueryData<idOSCredential[]>(["credentials"]) ?? [];

      queryClient.setQueryData<idOSCredential[]>(["credentials"], (old = []) =>
        old.filter((cred) => cred.id !== id),
      );

      return { previousCredentials };
    },
    async onError(_, __, ctx) {
      queryClient.setQueryData(["credentials"], ctx?.previousCredentials);
    },
  });
};

export const DeleteCredential = ({ isOpen, credential, onClose }: DeleteCredentialProps) => {
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteCredential = useDeleteCredentialMutation();
  const revokeGrants = useRevokeGrants();
  const grants = useFetchGrants({
    credentialId: credential.id,
  });

  const state = useMutationState({
    filters: {
      mutationKey: ["revokeGrant"],
      status: "pending",
    },
    select: (mutation) => mutation.state.variables as idOSGrant,
  });

  const handleClose = () => {
    revokeGrants.reset();
    deleteCredential.reset();
    onClose();
  };

  const handleRevokeGrants = async () => {
    if (grants.data && grants.data.length > 0) {
      toast({
        title: "Revoking grants",
        description: "Revoking grants that have been shared with others...",
        icon: <Spinner size="sm" />,
        position: "bottom-right",
        duration: 3000,
        status: "error",
      });

      await revokeGrants.mutateAsync(grants.data ?? [], {
        onSuccess() {
          toast({
            title: "Grant revocation successful",
            description: "All grants have been successfully revoked. Deleting credential...",
            icon: <Spinner size="sm" />,
            position: "bottom-right",
            status: "success",
          });
        },
        onError() {
          toast({
            title: "Error while revoking grants",
            description: "An unexpected error. Please try again.",
            duration: 3000,
            position: "bottom-right",
            status: "error",
          });
        },
      });
    }
  };

  const handleDeleteCredential = async () => {
    await handleRevokeGrants();
    await deleteCredential.mutateAsync(
      { id: credential.id, credential_type: meta.type },
      {
        onSuccess() {
          handleClose();
          toast({
            title: "Credential successfully removed",
            description: "Credential has been successfully removed",
            position: "bottom-right",
            status: "success",
          });
        },
        onError() {
          toast({
            title: "Error while deleting credential",
            description: "An unexpected error. Please try again.",
            duration: 3000,
            position: "bottom-right",
            status: "error",
          });
        },
      },
    );
  };

  if (!credential) return null;

  const [currentToRevoke] = state;
  const { grantee } = currentToRevoke ?? {};

  const meta = JSON.parse(credential.public_notes);

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
          <AlertDialogHeader>
            {revokeGrants.isPending
              ? "Revoking grants"
              : deleteCredential.isPending
                ? "Deleting credential"
                : "Delete credential"}
          </AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            {revokeGrants.isPending ? (
              <>
                <Text mb={1}>Revoking grant for grantee:</Text>
                <Code px={2} py={1} rounded="md" fontSize="sm" bg="neutral.800">
                  {grantee}
                </Code>
              </>
            ) : deleteCredential.isPending ? (
              <Text>
                Deleting credential of type{" "}
                <Text as="span" color="green.200" fontWeight="semibold">
                  {meta.type}
                </Text>{" "}
                from issuer{" "}
                <Text as="span" color="green.200" fontWeight="semibold">
                  {meta.issuer}
                </Text>
              </Text>
            ) : (
              <Text>Do you want to delete this credential from the idOS?</Text>
            )}
          </AlertDialogBody>
          <AlertDialogFooter>
            {!(revokeGrants.isPending || deleteCredential.isPending) ? (
              <Button ref={cancelRef} onClick={handleClose}>
                Cancel
              </Button>
            ) : null}

            <Button
              id={`confirm-delete-credential-${credential.id}`}
              colorScheme="red"
              ml={3}
              onClick={handleDeleteCredential}
              isLoading={revokeGrants.isPending || deleteCredential.isPending}
            >
              {deleteCredential.isError ? "Retry" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
