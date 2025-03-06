import { Box, Center, Show, Spinner, chakra } from "@chakra-ui/react";
import { useTheme } from "next-themes";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CreateProfile } from "@/features/create-profile";
import { ErrorFallback } from "@/features/error-fallback";
import { NotConnected } from "@/features/not-connected";
import { NotVerified } from "@/features/not-verified";
import { PendingVerification } from "@/features/pending-verification";
import { Profile } from "@/features/profile";
import { useIsleStore } from "@/store";

function Layout({ children }: PropsWithChildren) {
  return (
    <chakra.div display="grid">
      <chakra.div
        display="grid"
        gridTemplateRows="auto 1fr auto"
        gap="6"
        p="5"
        rounded="38px"
        bg={{
          _dark: "neutral.950",
          _light: "white",
        }}
        width="366px"
        height="full"
      >
        <Header />
        <chakra.main>{children}</chakra.main>
        <Footer />
      </chakra.div>
    </chakra.div>
  );
}

function WIP() {
  return (
    <Box h="full" pt="6" pb="8">
      <Center flexDir="column" gap="6">
        <Spinner size="xl" />
      </Center>
    </Box>
  );
}

export function App() {
  const { setTheme } = useTheme();
  const initializeNode = useIsleStore((state) => state.initializeNode);
  const theme = useIsleStore((state) => state.theme);
  const connectionStatus = useIsleStore((state) => state.connectionStatus);
  const status = useIsleStore((state) => state.status);

  useEffect(() => {
    const cleanup = initializeNode();
    return cleanup;
  }, [initializeNode]);

  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [theme, setTheme]);

  if (connectionStatus === "initializing" || status === "initializing") {
    return (
      <Layout>
        <WIP />
      </Layout>
    );
  }

  return (
    <Layout>
      <Show when={connectionStatus === "disconnected"}>
        <NotConnected />
      </Show>
      <Show when={connectionStatus === "connecting"}>
        <WIP />
      </Show>
      <Show when={connectionStatus === "connected"}>
        <Show when={status === "no-profile"}>
          <CreateProfile />
        </Show>
        <Show when={status === "verified"}>
          <Profile />
        </Show>
        <Show when={status === "pending-verification"}>
          <PendingVerification />
        </Show>
        <Show when={status === "not-verified"}>
          <NotVerified />
        </Show>
      </Show>
      <Show when={status === "error"}>
        <ErrorFallback error={new Error("This is a sample error description")} />
      </Show>
    </Layout>
  );
}
