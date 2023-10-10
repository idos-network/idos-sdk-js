import { Box } from "@chakra-ui/react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useEffectOnce } from "usehooks-ts";

import { Header } from "@/lib/components/header";
import { Loading } from "@/lib/components/loading";
import { ConnectWallet } from "./lib/components/connect-wallet";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffectOnce(() => {
    async function setup() {
      // await idos.crypto.init();
      // const web3provider = new BrowserProvider(window.ethereum);
      // const accounts = await web3provider.send("eth_requestAccounts", []);
      // await idos.auth.setWalletSigner(await web3provider.getSigner());
    }
    setup();
  });

  if (!isConnected) {
    return <ConnectWallet />;
  }

  if (isLoading) {
    return (
      <Box minH="100vh">
        <Loading />
      </Box>
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
