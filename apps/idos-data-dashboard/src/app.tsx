import { Box } from "@chakra-ui/react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { setupNightly } from "@near-wallet-selector/nightly";
import { BrowserProvider } from "ethers";
import { useMetaMask } from "metamask-react";
import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useEffectOnce } from "usehooks-ts";

import { ConnectWallet } from "@/lib/components/connect-wallet";
import { Header } from "@/lib/components/header";
import { Loading } from "@/lib/components/loading";
import { idos } from "@/lib/idos";
import { idOS } from "@idos-network/idos-sdk";

const setupEvmWallet = async () => {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  await idos.auth.setEvmSigner(signer);
  await idos.crypto.init();
  await idos.grants.init({ signer, type: "evm" });
};

const setUpNearWallet = async () => {
  const contractId = idOS.near.defaultContractId;
  let walletSelectorReady: (value?: unknown) => void;

  const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMeteorWallet(), setupHereWallet(), setupNightly()]
  });

  const modal = setupModal(selector, {
    contractId,
    methodNames: idOS.near.contractMethods
  });

  modal.on("onHide", async () => {
    try {
      const wallet = await selector.wallet();
      await idos.auth.setNearSigner(wallet);
      await idos.crypto.init();
      const accountId = (await wallet.getAccounts())[0].accountId;
      await idos.grants.init({ type: "near", accountId, wallet });
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

  useEffectOnce(() => {
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
          await idos.auth.setNearSigner(wallet);
          await idos.crypto.init();
          const accountId = (await wallet.getAccounts())[0].accountId;
          await idos.grants.init({ type: "near", accountId, wallet });
          setIsConnected(true);
        }
        setIsLoading(false);
      })();
    }
  });

  if (isLoading) {
    return (
      <Box minH="100vh">
        <Loading />
      </Box>
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
