import { useDisclosure } from "@chakra-ui/react";
import type { idOSWallet } from "@idos-network/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { Button } from "@/components/ui/button";
import { useWalletSelector } from "@/core/near";
import { useIdOS } from "@/idOS.provider";
import { AddWalletButton } from "./components/add-wallet-button";
import { AddWalletUsingModal } from "./components/add-wallet-modal";
import { DeleteWallet } from "./components/delete-wallet";
import { WalletCard } from "./components/wallet-card";

const useFetchWallets = () => {
  const idOSClient = useIdOS();

  return useQuery({
    queryKey: ["wallets"],
    queryFn: () => idOSClient.getWallets(),
    select: (data) => Object.groupBy(data, (wallet) => wallet.address),
  });
};

const NoWallets = () => {
  return (
    <NoData
      title="You have 0 wallets added."
      subtitle="Create your first wallet and store it on the idOS."
      cta="Add a wallet"
    />
  );
};

const LinkWalletError = () => {
  return (
    <span role="alert" className="block text-red-500 text-sm">
      You can't link a wallet to an account with no wallets. You'll be redirected back...
    </span>
  );
};

const WalletsList = () => {
  const wallets = useFetchWallets();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletsToDelete, setWalletToDelete] = useState<idOSWallet[] | undefined>([]);
  const { address: ethAddress } = useAccount();
  const { accounts } = useWalletSelector();

  const nearAddress = accounts?.[0]?.accountId;

  const address = ethAddress || nearAddress;

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
        <ul id="wallets-list" className="flex flex-col gap-2.5 flex-1">
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
};

export function Component() {
  const idOSClient = useIdOS();
  const [searchParams] = useSearchParams();
  const walletToAdd = searchParams.get("add-wallet") || undefined;
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const queryClient = useQueryClient();

  const hasProfile = !!idOSClient.user.id;

  useEffect(() => {
    if (walletToAdd && !hasProfile && callbackUrl) {
      setTimeout(() => {
        location.href = callbackUrl;
      }, 5_000);
    }
  }, [walletToAdd, hasProfile, callbackUrl]);

  if (!hasProfile) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col items-stretch gap-2.5 flex-1">
      <div className="flex items-center justify-between h-14 lg:h-20 p-5 bg-neutral-900 rounded-xl">
        <h1 className="block text-2xl! lg:text-3xl! font-bold!">Wallets</h1>
        {hasProfile ? (
          <div className="flex items-center gap-2.5">
            {import.meta.env.VITE_ADD_WALLET_USING_POPUP === "true" ? (
              <AddWalletButton />
            ) : (
              <AddWalletUsingModal defaultValue={walletToAdd} />
            )}
            <Button
              aria-label="Refresh wallets"
              variant="secondary"
              onClick={() => {
                queryClient.refetchQueries({
                  queryKey: ["wallets"],
                });
              }}
            >
              <RotateCw size={18} />
            </Button>
          </div>
        ) : (
          false
        )}
      </div>
      {hasProfile ? <WalletsList /> : <NoWallets />}
      {walletToAdd && !hasProfile ? <LinkWalletError /> : null}
    </div>
  );
}
Component.displayName = "Wallets";
