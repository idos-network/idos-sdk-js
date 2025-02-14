import { Show, chakra } from "@chakra-ui/react";
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
    <chakra.div display="grid" placeContent="center" minH="100vh" mx="auto">
      <chakra.div
        display="grid"
        gridTemplateRows="auto 1fr auto"
        gap="6"
        p="5"
        rounded="38px"
        bg={{
          _dark: "gray.950",
          _light: "white",
        }}
        border={{
          _dark: "1px solid {colors.gray.800}",
          _light: "1px solid {colors.gray.50}",
        }}
        shadow="2xl"
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

  return (
    <Layout>
      <Show when={status === "disconnected"}>
        <NotConnected />
      </Show>
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
      <Show when={status === "error"}>
        <ErrorFallback error={new Error("This is a sample error description")} />
      </Show>
    </Layout>
  );
}
