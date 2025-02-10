import { Center, Heading, Text, VStack, chakra } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import { injected, useAccount, useConnect } from "wagmi";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui";

function Layout({ children }: PropsWithChildren) {
  return (
    <chakra.div display="grid" gridTemplateRows="auto 1fr auto" minH="100dvh">
      <Header />
      <chakra.main px="5">{children}</chakra.main>
      <Footer />
    </chakra.div>
  );
}

function NotConnected() {
  const { connect, isPending } = useConnect();
  return (
    <Center flexDir="column" gap="6" h="full">
      <Center flexDir="column" gap="3" p="5">
        <VStack gap="3">
          <Heading fontSize="2xl" fontWeight="bold">
            Connect your wallet
          </Heading>
          <Text color="gray.500">
            Click the button below to connect your wallet and get started.
          </Text>
        </VStack>
        <Button
          w="full"
          loading={isPending}
          loadingText="Connecting..."
          onClick={() => {
            connect({ connector: injected() });
          }}
        >
          Connect your wallet
        </Button>
      </Center>
    </Center>
  );
}

export function App() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Layout>
        <NotConnected />
      </Layout>
    );
  }

  return <Layout />;
}
