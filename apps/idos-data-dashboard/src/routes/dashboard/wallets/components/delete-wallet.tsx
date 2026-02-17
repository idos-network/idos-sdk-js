import type { idOSWallet } from "@idos-network/kwil-infra/actions";
import { type DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { useIdOS } from "@/idOS.provider";

type DeleteWalletProps = {
  isOpen: boolean;
  wallets: idOSWallet[] | undefined;
  onClose: () => void;
};

type Ctx = { previousWallets: idOSWallet[] };

const useDeleteWalletMutation = () => {
  const idOSClient = useIdOS();
  const queryClient = useQueryClient();

  return useMutation<void, DefaultError, idOSWallet[], Ctx>({
    mutationFn: async (wallets) => {
      await idOSClient.removeWallets(wallets.map((wallet) => wallet.id));
    },
    async onMutate(wallets) {
      await queryClient.cancelQueries({ queryKey: ["wallets"] });
      const previousWallets = queryClient.getQueryData<idOSWallet[]>(["wallets"]) ?? [];

      queryClient.setQueryData<idOSWallet[]>(["wallets"], (old = []) =>
        old.filter((wallet) => wallet.address !== wallets[0].address),
      );

      return { previousWallets };
    },
  });
};

export const DeleteWallet = ({ isOpen, wallets, onClose }: DeleteWalletProps) => {
  const queryClient = useQueryClient();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteWallet = useDeleteWalletMutation();

  const handleClose = () => {
    deleteWallet.reset();
    onClose();
  };

  const handleDeleteWallet = (wallets: idOSWallet[]) => {
    deleteWallet.mutate(wallets, {
      async onSuccess() {
        handleClose();
      },
      async onError(error, __, ctx) {
        console.error("Error while deleting wallet:", error);
        queryClient.setQueryData(["wallets"], ctx?.previousWallets);
        toast({
          title: "Error while deleting wallet",
          description: "An unexpected error. Please try again.",
          position: "bottom-right",
          status: "error",
        });
      },
    });
  };

  if (!wallets || wallets.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-full bg-neutral-900 lg:max-w-lg" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Delete wallet</DialogTitle>
        </DialogHeader>
        <div>Do you want to delete this wallet from the idOS?</div>
        <DialogFooter className="flex items-center gap-2">
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
};
