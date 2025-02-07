import { Image, Text, chakra } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

import { Header } from "@/components/header";
import { NotConnected } from "@/features/not-connected";

function Layout({ children }: PropsWithChildren) {
  return (
    <chakra.div display="grid" placeContent="center" minH="100vh">
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
        width="full"
        height="full"
      >
        <Header />
        <chakra.main display={{ base: "none", sm: "flex" }}>{children}</chakra.main>
        <chakra.footer>
          <Text
            display={{ base: "none", sm: "flex" }}
            color="gray.500"
            fontSize="sm"
            textAlign="center"
            placeContent="center"
            alignItems="center"
            gap="2"
          >
            Powered by <Image src="/footer-logo.svg" alt="Powered by idOS" />
          </Text>
        </chakra.footer>
      </chakra.div>
    </chakra.div>
  );
}

export function App() {
  return (
    <Layout>
      <NotConnected />
    </Layout>
  );
}
