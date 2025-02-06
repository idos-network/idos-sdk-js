import { Center, Heading, Image, Text, VStack, chakra } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

function Layout({ children }: PropsWithChildren) {
  return (
    <chakra.div display="grid" placeContent="center" minH="100vh">
      <chakra.div
        display="grid"
        gridTemplateRows="auto 1fr auto"
        gap="6"
        p="5"
        rounded="38px"
        border="1px solid {colors.gray.100}"
        shadow="2xl"
        width="366px"
      >
        <chakra.header display="flex" alignItems="center" gap="2">
          <Logo />
          <VStack alignItems="flex-start" gap="1">
            <chakra.span fontSize="lg" fontWeight="semibold">
              idOS
            </chakra.span>
            <Badge colorPalette="gray" size="sm">
              DISCONNECTED
            </Badge>
          </VStack>
        </chakra.header>
        <chakra.main>{children}</chakra.main>
        <chakra.footer>
          <Text
            color="gray.500"
            fontSize="sm"
            textAlign="center"
            placeContent="center"
            display="flex"
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
      <Center flexDir="column" gap="2">
        <Heading fontSize="2xl">Own your data</Heading>
        <Text textAlign="center">
          The idOS Isle is the “window” on a target application into the idOS
        </Text>
      </Center>
    </Layout>
  );
}
