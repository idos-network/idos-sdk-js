import type { idOSWallet } from "@idos-network/kwil-infra/actions";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteWalletMutation } from "@/lib/mutations/wallets";

const WALLET_TYPE_LABEL: Record<string, string> = {
  EVM: "EVM",
  NEAR: "Near",
  XRPL: "XRP",
  Stellar: "Stellar",
  FaceSign: "FaceSign",
};

function truncateAddress(addr: string): string {
  if (addr.length <= 30) return addr;
  return `${addr.slice(0, 16)}...${addr.slice(-10)}`;
}

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

  const wallet = wallets[0];
  const address = wallet.address;
  const walletType = WALLET_TYPE_LABEL[wallet.wallet_type] ?? wallet.wallet_type;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-card max-w-full lg:max-w-lg" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Remove Wallet</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this wallet from your idOS profile?
          </DialogDescription>
        </DialogHeader>

        <div className="border-border bg-muted overflow-hidden rounded-lg border">
          <table className="table w-full border-collapse [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
            <tbody>
              <tr className="border-b">
                <th className="text-muted-foreground text-left font-medium">Address</th>
                <td className="text-right">
                  <span className="block truncate" title={address}>
                    {truncateAddress(address)}
                  </span>
                </td>
              </tr>
              <tr>
                <th className="text-muted-foreground text-left font-medium">Type</th>
                <td className="text-right">{walletType}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <DialogFooter className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            id={`confirm-delete-wallet-${address}`}
            variant="destructive"
            onClick={() => handleDeleteWallet(wallets)}
            isLoading={deleteWallet.isPending}
          >
            {deleteWallet.isError ? "Retry" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
