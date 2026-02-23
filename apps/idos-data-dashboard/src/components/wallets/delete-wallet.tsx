import type { idOSWallet } from "@idos-network/kwil-infra/actions";
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
        handleClose();
        toast.error("Error while deleting wallet", {
          description: "An unexpected error occurred. Please try again.",
        });
      },
    });
  };

  if (!wallets || wallets.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-full bg-card lg:max-w-lg" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Delete wallet</DialogTitle>
        </DialogHeader>
        <div>Do you want to delete this wallet from the idOS?</div>
        <DialogFooter className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleClose}>
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
