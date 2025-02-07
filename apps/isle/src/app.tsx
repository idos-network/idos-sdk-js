import { chakra } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CreateProfile } from "./features/create-profile";

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
  return (
    <Layout>
      <CreateProfile />
    </Layout>
  );
}
