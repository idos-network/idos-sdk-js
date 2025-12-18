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
import type { idOSGrant } from "@idos-network/core";
import type { idOSCredential } from "@idos-network/credentials/types";
import {
  type DefaultError,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";
import { useIdOS } from "@/idOS.provider";

import { timelockToMs } from "../../utils/time";
import { useFetchGrants, useRevokeGrants } from "../shared";

type DeleteCredentialProps = {
  isOpen: boolean;
  credential: idOSCredential;
  onClose: () => void;
};

type Ctx = { previousCredentials: idOSCredential[] };

const useDeleteCredentialMutation = () => {
  const idOSClient = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, DefaultError, { id: string }, Ctx>({
    mutationFn: async ({ id }) => {
      await idOSClient.removeCredential(id);

      return { id };
    },
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
  const grants = useFetchGrants({
    credentialId: credential.id,
  });
  const revokeGrants = useRevokeGrants();
  const hasTimeLock =
    grants.data?.length &&
    grants.data?.find((grant) => timelockToMs(+grant.locked_until) >= Date.now());

  const state = useMutationState({
    filters: {
      mutationKey: ["revokeGrant"],
      status: "pending",
    },
    select: (mutation) => mutation.state.variables as idOSGrant,
  });

  const handleClose = () => {
    revokeGrants.reset();
    grants.refetch();
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
    if (hasTimeLock) {
      toast({
        title: "Error while deleting credential",
        description:
          "This credential has a locked grant. You can't delete it until the grant locked until date is passed.",
        position: "bottom-right",
        status: "error",
      });
      return;
    }
    await handleRevokeGrants();
    await deleteCredential.mutateAsync(credential, {
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
    });
  };

  if (!credential) return null;

  const [currentToRevoke] = state;
  const { ag_grantee_wallet_identifier } = currentToRevoke ?? {};

  const meta = JSON.parse(credential.public_notes);

  return (
    <AlertDialog
      data-testid="delete-credential-dialog"
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
                <Text mb={1}>Revoking grant for consumer:</Text>
                <Code px={2} py={1} rounded="md" fontSize="sm" bg="neutral.800">
                  {ag_grantee_wallet_identifier}
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
