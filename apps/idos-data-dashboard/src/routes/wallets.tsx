import type { idOSWallet } from "@idos-network/kwil-infra/actions";
import { useState } from "react";
import { FacesignBanner } from "@/components/facesign/facesign-banner";
import { AddWalletButton } from "@/components/wallets/add-wallet-button";
import { DeleteWallet } from "@/components/wallets/delete-wallet";
import { WalletCard } from "@/components/wallets/wallet-card";
import useDisclosure from "@/hooks/use-disclosure";
import { useFetchWallets } from "@/lib/queries/wallets";
import { useSelector } from "@/machines/provider";
import { selectWalletAddress } from "@/machines/selectors";

function WalletsList() {
  const { data: wallets } = useFetchWallets();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletsToDelete, setWalletsToDelete] = useState<idOSWallet[]>([]);
  const address = useSelector(selectWalletAddress);

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
    <>
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
    </>
  );
}

<<<<<<< HEAD
const hasFacesignEnclave = !!COMMON_ENV.FACESIGN_ENCLAVE_URL;

=======
<<<<<<< HEAD
>>>>>>> d999ae1c (feat: improvements)
export default function Wallets() {
=======
const hasFacesignEnclave = !!import.meta.env.VITE_FACESIGN_ENCLAVE_URL;

function Wallets() {
>>>>>>> 3a42504b (feat: improvements)
  const { data: wallets } = useFetchWallets();
  const hasFacesignWallet = Object.values(wallets).some((group) =>
    group?.some((w) => w.wallet_type === "FaceSign"),
  );

  return (
    <div className="flex flex-1 flex-col items-stretch gap-5">
      <div className="flex h-14 items-center justify-between rounded-xl bg-card p-5 lg:h-20">
        <h1 className="block font-bold text-2xl lg:text-3xl">Wallets</h1>
        <div className="flex items-center gap-2.5">
          <AddWalletButton />
        </div>
      </div>
      {hasFacesignEnclave && !hasFacesignWallet && <FacesignBanner />}
      <WalletsList />
    </div>
  );
}
