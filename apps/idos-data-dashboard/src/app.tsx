import { ConnectWallet } from "#/connect-wallet.tsx";
import { setupNearWalletSelector } from "#/lib/ near/utils.ts";
import { idOS } from "#/lib/idos";
import { addressAtom } from "#/lib/state";
import { Center, Spinner } from "@chakra-ui/react";
import { idOS as idOSSDK } from "@idos-network/idos-sdk";
import { setupModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";
import { BrowserProvider } from "ethers";
import { useAtom } from "jotai";
import { useMetaMask } from "metamask-react";
import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { CookieConsent } from "./cookie-consent";

const setupEvmWallet = async () => {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { signer, address: signer.address };
};

const setUpNearWallet = async () => {
  const selector = await setupNearWalletSelector();

  if (!selector.isSignedIn()) {
    await new Promise<void>((resolve) => {
      const modal = setupModal(selector, {
        contractId: idOSSDK.near.defaultContractId,
        methodNames: idOSSDK.near.contractMethods
      });

      modal.on("onHide", () => {
        resolve();
      });
      modal.show();
    });
  }

  const signer = await selector.wallet();
  return { signer, address: (await signer.getAccounts())[0].accountId };
};

export default function App() {
  const metamask = useMetaMask();
  const initialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [, setAddress] = useAtom(addressAtom);

  const onMetamaskConnect = async () => {
    setIsLoading(true);
    try {
      await metamask.connect();
      const { signer, address } = await setupEvmWallet();
      const hasProfile = await idOS.hasProfile(address);

      if (hasProfile) {
        await idOS.setSigner("EVM", signer);
        setAddress(address);
      }

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
      const { signer, address } = await setUpNearWallet();
      const hasProfile = await idOS.hasProfile(address);

      if (hasProfile) {
        await idOS.setSigner("NEAR", signer);
        setAddress(address);
      }

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
          const { signer, address } = await setupEvmWallet();
          const hasProfile = await idOS.hasProfile(address);

          if (hasProfile) {
            await idOS.setSigner("EVM", signer);
            setAddress(address);
          }

          setIsConnected(true);
          setIsLoading(false);
        }

        const selector = await setupNearWalletSelector();
        if (selector.isSignedIn()) {
          const { signer, address } = await setUpNearWallet();
          const hasProfile = await idOS.hasProfile(address);

          if (hasProfile) {
            await idOS.setSigner("NEAR", signer);
            setAddress(address);
          }

          setIsConnected(true);
          setIsLoading(false);
        }
        setIsLoading(false);
      })();
    }
  });

  useEffect(() => {
    if (metamask.status === "notConnected") {
      setIsConnected(false);
      setAddress("");
    }
  }, [metamask.status, setAddress]);

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
      <>
        <ConnectWallet
          onNearConnect={onNearConnect}
          onMetamaskConnect={onMetamaskConnect}
        />
        <CookieConsent />
      </>
    );
  }

  return (
    <>
      <Outlet />
      <CookieConsent />
    </>
  );
}
