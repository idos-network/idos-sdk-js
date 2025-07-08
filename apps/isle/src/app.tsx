import { Box, Center, chakra, Show, Spinner } from "@chakra-ui/react";
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
    <chakra.div
      py="20px"
      className="isle"
      display="grid"
      gridTemplateRows="auto 1fr auto"
      gap="6"
      p="5"
      rounded="38px"
      bg="surface"
      border="1px solid {colors.border}"
      width="355px"
      height="full"
      maxHeight="full"
      shadow="0px 4px 9px -4px #00000066"
    >
      <Header />
      <chakra.main>{children}</chakra.main>
      <Footer />
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

  if (status === "initializing") {
    return (
      <Layout>
        <WIP />
      </Layout>
    );
  }

  return (
    <Layout>
      <Show when={status === "no-profile"}>
        <CreateProfile />
      </Show>
      <Show when={status === "verified"}>
        <Profile />
      </Show>
      <Show when={status === "pending-verification"}>
        <PendingVerification />
      </Show>
      <Show when={status === "pending-permissions"}>
        <NotVerified />
      </Show>
      <Show when={status === "not-verified"}>
        <NotVerified />
      </Show>
      <Show when={status === "not-connected"}>
        <NotConnected />
      </Show>
      <Show when={status === "error"}>
        <ErrorFallback error={new Error("This is a sample error description")} />
      </Show>
    </Layout>
  );
}
