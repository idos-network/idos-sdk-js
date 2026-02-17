import type { idOSWallet } from "@idos-network/kwil-infra/actions";
import { createFileRoute } from "@tanstack/react-router";
import { useSelector } from "@xstate/react";
import { useState } from "react";
import { AddWalletButton } from "@/components/wallets/add-wallet-button";
import { DeleteWallet } from "@/components/wallets/delete-wallet";
import { WalletCard } from "@/components/wallets/wallet-card";
import { WalletsError } from "@/components/wallets/wallets-error";
import { WalletsPending } from "@/components/wallets/wallets-pending";
import useDisclosure from "@/hooks/use-disclosure";
import { useFetchWallets, walletsQueryOptions } from "@/lib/queries/wallets";
import { dashboardActor } from "@/machines/dashboard.actor";
import { selectWalletAddress } from "@/machines/selectors";

export const Route = createFileRoute("/wallets")({
  component: Wallets,
  staticData: { breadcrumb: "Wallets" },
  pendingComponent: WalletsPending,
  errorComponent: WalletsError,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      "add-wallet": search["add-wallet"],
      callbackUrl: search.callbackUrl,
      publicKey: search.publicKey,
    };
  },
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(walletsQueryOptions()),
});

function WalletsList() {
  const { data: wallets } = useFetchWallets();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletsToDelete, setWalletToDelete] = useState<idOSWallet[] | undefined>([]);
  const address = useSelector(dashboardActor, selectWalletAddress);

  const handleDelete = (walletAddress: string) => {
    const toDelete = wallets[walletAddress];

    if (!toDelete) {
      return;
    }

    setWalletToDelete(toDelete);
    onOpen();
  };

  const handleClose = () => {
    setWalletToDelete([]);
    onClose();
  };

  const addresses = Object.keys(wallets);

  return (
    <>
      <ul id="wallets-list" className="flex flex-col gap-5 flex-1">
        {addresses.map((walletAddress) => (
          <li key={walletAddress} className="list-none">
            <WalletCard
              address={walletAddress}
              onDelete={handleDelete}
              isDisabled={address?.toLowerCase() === walletAddress.toLowerCase()}
            />
          </li>
        ))}
      </ul>
      <DeleteWallet isOpen={isOpen} wallets={walletsToDelete} onClose={handleClose} />
    </>
  );
}

function Wallets() {
  return (
    <div className="flex flex-col items-stretch gap-5 flex-1">
      <div className="flex items-center justify-between h-14 lg:h-20 p-5 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl lg:text-3xl font-bold">Wallets</h1>
        <div className="flex items-center gap-2.5">
          <AddWalletButton />
        </div>
      </div>
      <WalletsList />
    </div>
  );
}
