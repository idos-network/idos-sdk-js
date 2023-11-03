import { Center, Text } from "@chakra-ui/react";
import { idOS as idOSSDK } from "@idos-network/idos-sdk";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupNightly } from "@near-wallet-selector/nightly";
import { BrowserProvider } from "ethers";
import { useMetaMask } from "metamask-react";
import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import { ConnectWallet } from "#/connect-wallet.tsx";
import { idOS } from "#/lib/idos";

const setupEvmWallet = async () => {
  const provider = new BrowserProvider(window.ethereum);
  return provider.getSigner();
};

const setUpNearWallet = async () => {
  const selector = await setupWalletSelector({
    network: idOSSDK.near.defaultNetwork,
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()]
  });

  if (!selector.isSignedIn()) {
    await new Promise((resolve) => {
      const modal = setupModal(selector, {
        contractId: idOSSDK.near.defaultContractId,
        methodNames: idOSSDK.near.contractMethods
      });
      modal.on("onHide", () => setTimeout(resolve, 100));
      modal.show();
    });
  }

  return selector.wallet();
};

export default function App() {
  const metamask = useMetaMask();
  const initialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const onMetamaskConnect = async () => {
    setIsLoading(true);
    try {
      await metamask.connect();
      const signer = await setupEvmWallet();
      await idOS.setSigner("EVM", signer);
      setIsConnected(true);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const onNearConnect = async () => {
    setIsLoading(true);
    try {
      const signer = await setUpNearWallet();
      await idOS.setSigner("NEAR", signer);
      setIsConnected(true);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      (async () => {
        if (metamask.status === "connected") {
          const signer = await setupEvmWallet();
          await idOS.setSigner("EVM", signer);
          setIsConnected(true);
        }
        const selector = await setupWalletSelector({
          network: idOSSDK.near.defaultNetwork,
          modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()]
        });
        if (selector.isSignedIn()) {
          const signer = await setUpNearWallet();
          await idOS.setSigner("NEAR", signer);
          setIsConnected(true);
        }
        setIsLoading(false);
      })();
    }
  });

  if (isLoading) {
    return (
      <Center minH="100vh">
        <Text>Loading ...</Text>
      </Center>
    );
  }

  if (!isConnected) {
    return (
      <ConnectWallet
        onNearConnect={onNearConnect}
        onMetamaskConnect={onMetamaskConnect}
      />
    );
  }

  return <Outlet />;
}
