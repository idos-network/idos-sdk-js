import type { idOSGrant } from "@idos-network/kwil-infra/actions";
import { useMutationState } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteCredentialMutation, useRevokeGrants } from "@/lib/mutations/credentials";
import { useFetchGrants } from "@/lib/queries/credentials";
import { timelockToMs } from "@/lib/time";
import { safeParse } from "./shared";
import type { idOSCredentialWithShares } from "./types";

interface DeleteCredentialProps {
  isOpen: boolean;
  credential: idOSCredentialWithShares | null;
  onClose: () => void;
}

export function DeleteCredential({ isOpen, credential, onClose }: DeleteCredentialProps) {
  const deleteCredential = useDeleteCredentialMutation();
  const grants = useFetchGrants({
    credentialId: credential?.id ?? "",
  });
  const revokeGrants = useRevokeGrants();

  const state = useMutationState({
    filters: {
      mutationKey: ["revokeGrant"],
      status: "pending",
    },
    select: (mutation) => mutation.state.variables as idOSGrant,
  });

  if (!credential) {
    return null;
  }

  const hasTimeLock =
    grants.data?.length &&
    grants.data?.find((grant) => timelockToMs(+grant.locked_until) >= Date.now());

  const handleClose = () => {
    revokeGrants.reset();
    grants.refetch();
    onClose();
  };

  const handleRevokeGrants = async () => {
    if (grants.data && grants.data.length > 0) {
      const loadingToast = toast.loading("Revoking grants", {
        description: "Revoking grants that have been shared with others...",
      });

      await revokeGrants.mutateAsync(grants.data ?? [], {
        onSuccess() {
          toast.dismiss(loadingToast);
          toast.success("Grant revocation successful", {
            description: "All grants have been successfully revoked. Deleting credential...",
          });
        },
        onError() {
          toast.dismiss(loadingToast);
          handleClose();
          toast.error("Error while revoking grants", {
            description: "An unexpected error occurred. Please try again.",
          });
        },
      });
    }
  };

  const handleDeleteCredential = async () => {
    if (hasTimeLock) {
      handleClose();
      toast.error("Error while deleting credential", {
        description:
          "This credential has a locked grant. You can't delete it until the grant locked until date is passed.",
      });
      return;
    }

    try {
      await handleRevokeGrants();
      await deleteCredential.mutateAsync(credential);
      handleClose();
      toast.success("Credential successfully removed", {
        description: "Credential has been successfully removed",
      });
    } catch (error) {
      console.error("Failed to delete credential:", error);
      handleClose();
      toast.error("Error while deleting credential", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const [currentToRevoke] = state;
  const { ag_grantee_wallet_identifier } = currentToRevoke ?? {};

  const meta = safeParse<{ type?: string; issuer?: string }>(credential.public_notes);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
            <div className="flex flex-col items-stretch gap-2">
              <span className="mb-1 block">Revoking grant for consumer:</span>
              <Code>{ag_grantee_wallet_identifier ?? "wallet-identifier-not-available"}</Code>
            </div>
          ) : deleteCredential.isPending ? (
            <div>
              Deleting credential of type{" "}
              <span className="font-semibold text-green-200">{meta.type}</span> from issuer{" "}
              <span className="font-semibold text-green-200">{meta.issuer}</span>
            </div>
          ) : (
            <span className="block">Do you want to delete this credential from the idOS?</span>
          )}
        </div>
        <DialogFooter className="flex items-center gap-2">
          {!(revokeGrants.isPending || deleteCredential.isPending) ? (
            <Button variant="secondary" onClick={handleClose}>
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
}
