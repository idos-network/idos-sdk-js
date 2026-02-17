import type { idOSWallet } from "@idos-network/kwil-infra/actions";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteWalletMutation } from "@/lib/mutations/wallets";

interface DeleteWalletProps {
  isOpen: boolean;
  wallets: idOSWallet[] | undefined;
  onClose: () => void;
}

export function DeleteWallet({ isOpen, wallets, onClose }: DeleteWalletProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteWallet = useDeleteWalletMutation();

  const handleClose = () => {
    deleteWallet.reset();
    onClose();
  };

  const handleDeleteWallet = (wallets: idOSWallet[]) => {
    deleteWallet.mutate(wallets, {
      onSuccess() {
        handleClose();
      },
      onError(error) {
        console.error("Error while deleting wallet:", error);
        toast.error("Error while deleting wallet", {
          description: "An unexpected error. Please try again.",
        });
      },
    });
  };

  if (!wallets || wallets.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-full lg:max-w-lg bg-neutral-900" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Delete wallet</DialogTitle>
        </DialogHeader>
        <div>Do you want to delete this wallet from the idOS?</div>
        <DialogFooter className="flex gap-2 items-center">
          <Button ref={cancelRef} variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            id={`confirm-delete-wallet-${wallets[0].address}`}
            variant="destructive"
            onClick={() => handleDeleteWallet(wallets)}
            isLoading={deleteWallet.isPending}
          >
            {deleteWallet.isError ? "Retry" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
