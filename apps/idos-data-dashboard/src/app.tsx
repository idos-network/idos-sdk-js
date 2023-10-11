import { Box } from "@chakra-ui/react";
import { Wallet, setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupNightly } from "@near-wallet-selector/nightly";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { ConnectWallet } from "@/lib/components/connect-wallet";
import { Header } from "@/lib/components/header";
import { Loading } from "@/lib/components/loading";
import { idos } from "@/lib/idos";
import { useEffectOnce } from "usehooks-ts";

const setUpNearWallet = async () => {
  const contractId = idos.grants.near.defaultContractId;
  let wallet: Wallet, walletSelectorReady: (value?: unknown) => void;

  const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()],
  });

  const modal = setupModal(selector, {
    contractId,
    methodNames: idos.grants.near.contractMethods,
  });

  modal.on("onHide", async () => {
    wallet = await selector.wallet();
    await idos.auth.setNearSigner(wallet);
    await idos.crypto.init();
    walletSelectorReady();
  });
  modal.show();
  await new Promise((resolve) => (walletSelectorReady = resolve));
};

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const onNearConnect = async () => {
    // setIsLoading(true);
    await setUpNearWallet();
    setIsLoading(false);
    setIsConnected(true);
  };

  useEffectOnce(() => {
    (async () => {
      setIsLoading(true);
      const selector = await setupWalletSelector({
        network: "testnet",
        modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()],
      });
      if (selector.isSignedIn()) {
        const wallet = await selector.wallet();
        await idos.auth.setNearSigner(wallet);
        await idos.crypto.init();
        setIsConnected(true);
      }
      setIsLoading(false);
    })();
  });

  if (isLoading) {
    return (
      <Box minH="100vh">
        <Loading />
      </Box>
    );
  }

  if (!isConnected) {
    return <ConnectWallet onNearConnect={onNearConnect} />;
  }

  return (
    <Box minH="100vh">
      <Header />
      <Box maxW="container.xl" mx="auto" p={6}>
        <Box my={20}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
