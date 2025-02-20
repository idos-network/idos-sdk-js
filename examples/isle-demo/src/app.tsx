import { Center, Flex, Heading, Text, VStack, chakra } from "@chakra-ui/react";
import { idOSIsle } from "@idos-network/idos-sdk";
import { type PropsWithChildren, useEffect, useRef } from "react";
import { injected, useAccount, useConnect } from "wagmi";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui";

function Layout({ children }: PropsWithChildren) {
  return (
    <chakra.div display="grid" gridTemplateRows="auto 1fr auto" minH="100dvh">
      <Header />
      <chakra.main px="5">{children}</chakra.main>
      <Flex
        id="idos"
        position="absolute"
        left="50%"
        bottom="5%"
        transform="translateX(-50%)"
        w="400px"
        h="100px"
        visibility="hidden"
        css={{
          "&.visible": {
            visibility: "visible",
          },
        }}
      />
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

function Demo() {
  const isleRef = useRef<idOSIsle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleRef.current) return;

    isleRef.current = idOSIsle.initialize({
      container: container.id,
      kwilOptions: {
        nodeUrl: import.meta.env.VITE_IDOS_NODE_URL,
      },
    });

    isleRef.current.on("connect-wallet", async () => {
      await isleRef.current?.connect();
    });
    isleRef.current.on("create-key-pair", async () => {
      await isleRef.current?.createKeyPair();
    });

    return () => {
      isleRef.current?.destroy();
      isleRef.current = null;
    };
  }, []);

  return (
    <Center h="full" flexDir="column" gap="5">
      <div ref={containerRef} id="idOS-isle" style={{ width: "100%", height: "600px" }} />
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

  return (
    <Layout>
      <Demo />
    </Layout>
  );
}
