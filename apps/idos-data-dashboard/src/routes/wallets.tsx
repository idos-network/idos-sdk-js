import type { idOSWallet } from "@idos-network/kwil-infra/actions";

import { useState } from "react";

import { FacesignBanner } from "@/components/facesign/facesign-banner";
import { AddWalletButton } from "@/components/wallets/add-wallet-button";
import { DeleteWallet } from "@/components/wallets/delete-wallet";
import { WalletCard } from "@/components/wallets/wallet-card";
import { COMMON_ENV } from "@/core/envFlags.common";
import useDisclosure from "@/hooks/use-disclosure";
import { useFetchWallets } from "@/lib/queries/wallets";
import { useSelector } from "@/machines/provider";
import { selectWalletAddress } from "@/machines/selectors";

const hasFacesignEnclave = !!COMMON_ENV.FACESIGN_ENCLAVE_URL;

function WalletsList() {
  const { data: wallets } = useFetchWallets();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletsToDelete, setWalletsToDelete] = useState<idOSWallet[]>([]);
  const address = useSelector(selectWalletAddress);

  const hasFacesignWallet = Object.values(wallets).some((group) =>
    group?.some((w) => w.wallet_type === "FaceSign"),
  );

  const handleDelete = (walletAddress: string) => {
    const toDelete = wallets[walletAddress];

    if (!toDelete) {
      return;
    }

    setWalletsToDelete(toDelete);
    onOpen();
  };

  const handleClose = () => {
    setWalletsToDelete([]);
    onClose();
  };

  const addresses = Object.keys(wallets);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {hasFacesignEnclave && !hasFacesignWallet && <FacesignBanner />}
      <ul id="wallets-list" className="flex flex-1 flex-col gap-5">
        {addresses.map((walletAddress) => (
          <li key={walletAddress} className="list-none">
            <WalletCard
              address={walletAddress}
              walletType={wallets[walletAddress]?.[0]?.wallet_type}
              onDelete={handleDelete}
              isDisabled={address?.toLowerCase() === walletAddress.toLowerCase()}
            />
          </li>
        ))}
      </ul>
      <DeleteWallet isOpen={isOpen} wallets={walletsToDelete} onClose={handleClose} />
    </div>
  );
}

export default function Wallets() {
  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="bg-card flex h-14 items-center justify-between rounded-xl p-5 lg:h-20">
        <h1 className="block text-2xl font-bold lg:text-3xl">Wallets</h1>
        <div className="flex items-center gap-2.5">
          <AddWalletButton />
        </div>
      </div>
      <WalletsList />
    </div>
  );
}
