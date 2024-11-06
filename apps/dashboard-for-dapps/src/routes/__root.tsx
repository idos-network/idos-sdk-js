import {
  Center,
  Container,
  Flex,
  Grid,
  HStack,
  Heading,
  Image,
  Text,
  chakra,
} from "@chakra-ui/react";
import { Button } from "@idos-network/ui-kit";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

import { Provider } from "@/idOS.provider";

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
  const { connect, isPending } = useConnect();
  return (
    <Center h="100dvh" flexDirection="column" gap="4">
      <Heading fontSize="xl">Connect your wallet to continue</Heading>
      <Button
        loading={isPending}
        onClick={() =>
          connect({
            connector: injected(),
          })
        }
      >
        Connect your wallet
      </Button>
    </Center>
  );
}

function RootComponent() {
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();

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
            {isConnected ? <Button onClick={() => disconnect()}>Disconnect</Button> : null}
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
