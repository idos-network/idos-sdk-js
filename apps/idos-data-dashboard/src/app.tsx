import { Box } from "@chakra-ui/react";
import { BrowserProvider } from "ethers";
import { useMetaMask } from "metamask-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useEffectOnce } from "usehooks-ts";

import { ConnectWallet } from "@/lib/components/connect-wallet";
import { Header } from "@/lib/components/header";
import { Loading } from "@/lib/components/loading";
import { idos } from "@/lib/idos";

const setupEvmWallet = async () => {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  await idos.auth.setWalletSigner(signer);
  await idos.crypto.init();
};

export default function App() {
  const metamask = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const onMetamaskConnect = async () => {
    await metamask.connect();
    await setupEvmWallet();
    setIsConnected(true);
    setIsLoading(false);
  };

  useEffectOnce(() => {
    (async function () {
      if (metamask.status === "connected") {
        setIsLoading(true);
        await setupEvmWallet();
        setIsConnected(true);
        setIsLoading(false);
      }
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
    return <ConnectWallet onMetamaskConnect={onMetamaskConnect} />;
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
