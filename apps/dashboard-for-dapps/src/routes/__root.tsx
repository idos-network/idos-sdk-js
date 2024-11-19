import {
  Center,
  Container,
  Flex,
  Grid,
  HStack,
  Heading,
  Image,
  Text,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { Button } from "@idos-network/ui-kit";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Link, Outlet, createRootRouteWithContext, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useAccount, useDisconnect } from "wagmi";

import { useWalletSelector } from "@/contexts/near";
import { Provider } from "@/idOS.provider";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useEffect, useMemo } from "react";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <Center flexDirection="column" h="100dvh">
        <Text color="red.500">Route not found</Text>
      </Center>
    );
  },
});

function ConnectWallet() {
  const { open } = useWeb3Modal();
  const { modal } = useWalletSelector();

  return (
    <Center h="100dvh" flexDirection="column" gap="4">
      <Heading fontSize="xl">Connect your wallet to continue</Heading>
      <VStack
        align="stretch"
        minW={{
          base: "360",
          lg: 400,
        }}
        gap={3}
      >
        <Button size="lg" justifyContent="space-between" onClick={() => open()}>
          Connect a wallet
          <Image alt="NEAR logo" src="/wallet-connect.svg" w={8} h={8} mr={1} />
        </Button>
        <Button size="lg" justifyContent="space-between" onClick={() => modal.show()}>
          Connect with NEAR
          <Image alt="NEAR logo" src="/near.svg" w={10} h={10} />
        </Button>
      </VStack>
    </Center>
  );
}

const DisconnectButton = () => {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { selector } = useWalletSelector();
  const queryClient = useQueryClient();

  const handleDisconnect = async () => {
    if (isConnected) disconnect();
    if (selector.isSignedIn()) (await selector.wallet()).signOut();
    queryClient.removeQueries();
  };

  return (
    <Button id="disconnect-wallet-btn" colorScheme="green" onClick={handleDisconnect}>
      Disconnect wallet
    </Button>
  );
};

function RootComponent() {
  const { isConnected: isEthConnected } = useAccount();
  const { accounts } = useWalletSelector();

  const isConnected = useMemo(
    () => accounts.length > 0 || isEthConnected,
    [accounts, isEthConnected],
  );

  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });

  useEffect(() => {
    if (!isConnected) {
      queryClient.clear();
      navigate({
        search: {},
      });
    }
  }, [isConnected, queryClient, navigate]);

  if (!isConnected) {
    return <ConnectWallet />;
  }

  return (
    <Grid gridTemplateRows=" auto 1fr auto" minH="100dvh">
      <chakra.header bg="gray.950" pos="sticky" top="0" zIndex="sticky">
        <Container>
          <Flex alignItems="center" justifyContent="space-between" h="20">
            <Link to="/">
              <HStack gap="2">
                <Image src="/logo.svg" alt="idOS" width="10" height="10" />
                <Text fontSize="lg">Dashboard for dApps</Text>
              </HStack>
            </Link>
            {isConnected ? <DisconnectButton /> : null}
          </Flex>
        </Container>
      </chakra.header>
      <chakra.main paddingY="6">
        <Provider>
          <Outlet />
        </Provider>
      </chakra.main>
      <chakra.div id="idOS-enclave" hidden />
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </Grid>
  );
}
