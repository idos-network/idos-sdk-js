import { Center, Text } from "@chakra-ui/react";
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

import { idOS } from "#/lib/idos";
import { idOS as idOSSDK } from "@idos-network/idos-sdk";

const setupEvmWallet = async () => {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  await idOS.auth.setEvmSigner(signer);
  await idOS.crypto.init();
  await idOS.grants.init({ signer, type: "evm" });
};

const setUpNearWallet = async () => {
  const contractId = idOSSDK.near.defaultContractId;
  let walletSelectorReady: (value?: unknown) => void;

  const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()]
  });

  const modal = setupModal(selector, {
    contractId,
    methodNames: idOSSDK.near.contractMethods
  });

  modal.on("onHide", async () => {
    try {
      const wallet = await selector.wallet();
      await idOS.auth.setNearSigner(wallet);
      await idOS.crypto.init();
      const accountId = (await wallet.getAccounts())[0].accountId;
      await idOS.grants.init({ type: "near", accountId, wallet });
      walletSelectorReady();
    } catch (error) {
      walletSelectorReady(error);
    }
  });
  modal.show();
  return await new Promise<void>(
    (resolve, reject) =>
      (walletSelectorReady = (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      })
  );
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
      await setupEvmWallet();
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
      await setUpNearWallet();
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
          await setupEvmWallet();
          setIsConnected(true);
        }
        const selector = await setupWalletSelector({
          network: "testnet",
          modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()]
        });
        if (selector.isSignedIn()) {
          const wallet = await selector.wallet();
          await idOS.auth.setNearSigner(wallet);
          await idOS.crypto.init();
          const accountId = (await wallet.getAccounts())[0].accountId;
          await idOS.grants.init({ type: "near", accountId, wallet });
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
      <Center minH="100vh">
        <button onClick={onMetamaskConnect}>Connect to Metamask</button>
        <button onClick={onNearConnect}>Connect to Near</button>
      </Center>
    );
  }

  return <Outlet />;
}
