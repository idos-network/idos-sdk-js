import { Box } from "@chakra-ui/react";
import { BrowserProvider } from "ethers";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useEffectOnce } from "usehooks-ts";

import { Header } from "@/lib/components/header";
import { Loading } from "@/lib/components/loading";
import { idos } from "@/lib/idos";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffectOnce(() => {
    async function setup() {
      await idos.crypto.init();
      const web3provider = new BrowserProvider(window.ethereum);
      await web3provider.send("eth_requestAccounts", []);
      await idos.auth.setWalletSigner(await web3provider.getSigner());
    }
    setup().then(() => setIsLoading(false));
  });

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
