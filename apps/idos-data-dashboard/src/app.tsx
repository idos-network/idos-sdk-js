import { ConnectWallet } from "#/connect-wallet.tsx";
import { getEthersSigner } from "#/lib/ethers";
import { idOS } from "#/lib/idos";

import { nearWalletSelector } from "#/lib/near/utils";
import { addressAtom } from "#/lib/state";
import { Center, Spinner } from "@chakra-ui/react";
import { idOS as idOSSDK } from "@idos-network/idos-sdk";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAccount as useEVMAccount } from "wagmi";
import { mainnet } from "wagmi/chains";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const setAddress = useSetAtom(addressAtom);
  const ckModal = useWeb3Modal();
  const evmAccount = useEVMAccount();

  const onWalletConect = async () => {
    ckModal.open();
  };

  const onNearConnect = async () => {
    const modal = setupModal(nearWalletSelector, {
      contractId: idOSSDK.near.defaultContractId,
      methodNames: idOSSDK.near.contractMethods
    });
    modal.show();
  };

  useEffect(() => {
    (async () => {
      if (evmAccount.isDisconnected) {
        setAddress("");
        setIsConnected(false);
      }

      if (evmAccount.isConnected) {
        const signer = await getEthersSigner({ chainId: mainnet.id });
        const hasProfile = await idOS.hasProfile(evmAccount.address as string);

        if (hasProfile) {
          await idOS.setSigner("EVM", signer);
          setAddress(evmAccount.address as string);
          setIsConnected(true);
        }
      }

      const subscription = nearWalletSelector.store.observable.subscribe(
        async (state) => {
          const account = state.accounts?.[0]?.accountId;
          const hasProfile = await idOS.hasProfile(account);

          if (hasProfile) {
            await idOS.setSigner("NEAR", await nearWalletSelector.wallet());
            setAddress(account);
            setIsConnected(true);
          }

          setIsLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    })();
  });

  if (isLoading) {
    return (
      <Center
        minH="100vh"
        p={6}
        bg={`url('/cubes.png') center center no-repeat`}
        bgSize="cover"
      >
        <Center gap={2} p={5} bg="blackAlpha.700" rounded="lg">
          <Spinner />
        </Center>
      </Center>
    );
  }

  if (!isConnected) {
    return (
      <ConnectWallet
        onNearConnect={onNearConnect}
        onWalletConnect={onWalletConect}
      />
    );
  }

  return <Outlet />;
}
