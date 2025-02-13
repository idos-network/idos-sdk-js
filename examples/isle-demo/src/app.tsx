import {
  Box,
  Center,
  Code,
  Fieldset,
  Heading,
  Stack,
  Text,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { idOSIsle, type idOSIsleStatus, type idOSIsleTheme } from "@idos-network/idos-sdk";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { injected, useAccount, useConnect } from "wagmi";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button, Radio, RadioGroup } from "@/components/ui";

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

function Demo() {
  const isleRef = useRef<idOSIsle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTheme, setCurrentTheme] = useState<idOSIsleTheme>("light");
  const [currentStatus, setCurrentStatus] = useState<idOSIsleStatus>("disconnected");
  const [stack, setStack] = useState<
    {
      type: "initialized" | "updated";
      theme: idOSIsleTheme;
      status: idOSIsleStatus;
    }[]
  >([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isleRef.current) return;

    isleRef.current = idOSIsle.initialize({
      container: container.id,
    });

    // Listen for initialization
    isleRef.current.on("initialized", ({ data: { theme, status } }) => {
      setCurrentTheme(theme);
      setCurrentStatus(status);
      setStack((prev) => [...prev, { type: "initialized", theme, status }]);
    });

    // Listen for theme updates
    isleRef.current.on("updated", ({ data: { theme, status } }) => {
      setCurrentTheme(theme);
      setCurrentStatus(status);
      setStack((prev) => [...prev, { type: "updated", theme, status }]);
    });

    return () => {
      isleRef.current?.destroy();
      isleRef.current = null;
    };
  }, []);

  const handleSetTheme = (event: React.FormEvent<HTMLDivElement>) => {
    const theme = (event.target as HTMLInputElement).value as idOSIsleTheme;
    setCurrentTheme(theme);
    isleRef.current?.send("update", { theme });
  };

  const handleSetStatus = (event: React.FormEvent<HTMLDivElement>) => {
    const status = (event.target as HTMLInputElement).value as idOSIsleStatus;
    setCurrentStatus(status);
    isleRef.current?.send("update", { status });
  };

  return (
    <Center h="full" flexDir="column" gap="5">
      <div ref={containerRef} id="idOS-isle" style={{ width: "100%", height: "600px" }} />
      <Stack
        direction={{
          base: "column",
          md: "row",
        }}
        gap="5"
        alignItems="stretch"
        w="full"
      >
        <VStack gap="5" flex="1" alignItems="stretch">
          <Box border="1px solid {colors.gray.200}" p="5" rounded="md">
            <Fieldset.Root>
              <Fieldset.Legend>Theme</Fieldset.Legend>
              <Fieldset.HelperText>Choose the theme of the isle</Fieldset.HelperText>
              <RadioGroup onChange={handleSetTheme} value={currentTheme}>
                <Stack direction="row" gap={5}>
                  <Radio value="light">Light theme</Radio>
                  <Radio value="dark">Dark theme</Radio>
                </Stack>
              </RadioGroup>
            </Fieldset.Root>
          </Box>
          <Box border="1px solid {colors.gray.200}" p="5" rounded="md">
            <Fieldset.Root>
              <Fieldset.Legend>Status</Fieldset.Legend>
              <Fieldset.HelperText>Choose the application status the isle</Fieldset.HelperText>
              <RadioGroup onChange={handleSetStatus} value={currentStatus}>
                <Stack direction="column" gap={5}>
                  <Radio value="disconnected">Disconnected</Radio>
                  <Radio value="no-profile">No profile</Radio>
                  <Radio value="not-verified">Not verified</Radio>
                  <Radio value="pending-verification">Pending verification</Radio>
                  <Radio value="verified">Verified</Radio>
                  <Radio value="error">Error</Radio>
                </Stack>
              </RadioGroup>
            </Fieldset.Root>
          </Box>
        </VStack>
        <VStack
          gap="1"
          align="stretch"
          w="full"
          h="full"
          p="1"
          bg={{
            _dark: "gray.900",
            _light: "gray.100",
          }}
          flex="1"
          rounded="md"
          maxH="488px"
          overflow="auto"
        >
          {stack.map((event) => (
            <Code key={crypto.randomUUID()} colorPalette="green">
              {JSON.stringify(event, null, 2)}
            </Code>
          ))}
        </VStack>
      </Stack>
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
