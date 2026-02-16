import type { idOSCredential } from "@idos-network/credentials/types";
import type { idOSGrant } from "@idos-network/kwil-infra/actions";
import {
  type DefaultError,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { useIdOS } from "@/idOS.provider";
import { timelockToMs } from "../../utils/time";
import { safeParse, useFetchGrants, useRevokeGrants } from "../shared";
import type { idOSCredentialWithShares } from "../types";

type DeleteCredentialProps = {
  isOpen: boolean;
  credential: idOSCredentialWithShares;
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
        position: "bottom-right",
        duration: 3000,
        status: "error",
      });

      await revokeGrants.mutateAsync(grants.data ?? [], {
        onSuccess() {
          toast({
            title: "Grant revocation successful",
            description: "All grants have been successfully revoked. Deleting credential...",
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

  const meta = safeParse<{ type?: string; issuer?: string }>(credential.public_notes);

  return (
    <Dialog
      data-testid="delete-credential-dialog"
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {revokeGrants.isPending
              ? "Revoking grants"
              : deleteCredential.isPending
                ? "Deleting credential"
                : "Delete credential"}
          </DialogTitle>
        </DialogHeader>
        <div>
          {revokeGrants.isPending ? (
            <>
              <span className="block mb-1">Revoking grant for consumer:</span>
              <Code>{ag_grantee_wallet_identifier ?? "wallet-identifier-not-available"}</Code>
            </>
          ) : deleteCredential.isPending ? (
            <span className="block">
              Deleting credential of type{" "}
              <span className="block text-green-200 font-semibold">{meta.type}</span> from issuer{" "}
              <span className="block text-green-200 font-semibold">{meta.issuer}</span>
            </span>
          ) : (
            <span className="block">Do you want to delete this credential from the idOS?</span>
          )}
        </div>
        <DialogFooter className="flex gap-2 items-center">
          {!(revokeGrants.isPending || deleteCredential.isPending) ? (
            <Button ref={cancelRef} variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          ) : null}

          <Button
            id={`confirm-delete-credential-${credential.id}`}
            variant="destructive"
            onClick={handleDeleteCredential}
            isLoading={revokeGrants.isPending || deleteCredential.isPending}
          >
            {deleteCredential.isError ? "Retry" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
