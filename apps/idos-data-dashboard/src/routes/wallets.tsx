import type { idOSWallet } from "@idos-network/kwil-infra/actions";
import { createFileRoute } from "@tanstack/react-router";
import { useSelector } from "@xstate/react";
import { useState } from "react";
import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { AddWalletButton } from "@/components/wallets/add-wallet-button";
import { DeleteWallet } from "@/components/wallets/delete-wallet";
import { WalletCard } from "@/components/wallets/wallet-card";
import useDisclosure from "@/hooks/use-disclosure";
import { useFetchWallets } from "@/lib/queries/wallets";
import { dashboardActor } from "@/machines/dashboard.actor";
import { selectWalletAddress } from "@/machines/selectors";

export const Route = createFileRoute("/wallets")({
  component: Wallets,
  staticData: { breadcrumb: "Wallets" },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      "add-wallet": search["add-wallet"],
      callbackUrl: search.callbackUrl,
      publicKey: search.publicKey,
    };
  },
});

function WalletsList() {
  const wallets = useFetchWallets();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletsToDelete, setWalletToDelete] = useState<idOSWallet[] | undefined>([]);
  const address = useSelector(dashboardActor, selectWalletAddress);

  const handleDelete = (address: string) => {
    const walletsToDelete = wallets.data?.[address];

    if (!walletsToDelete) return;

    setWalletToDelete(walletsToDelete);
    onOpen();
  };

  const handleClose = () => {
    setWalletToDelete([]);
    onClose();
  };

  if (wallets.isFetching) {
    return <DataLoading />;
  }

  if (wallets.isError) {
    return <DataError onRetry={wallets.refetch} />;
  }

  if (wallets.isSuccess) {
    const addresses = Object.keys(wallets.data);

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
