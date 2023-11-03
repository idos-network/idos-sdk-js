import idOSDashboardLogo from "#/assets/idos-dashboard-logo.svg";
import { ConnectedWallet } from "#/lib/components/connected-wallet";
import { Sidebar } from "#/lib/components/sidebar";
import { Box, Flex, Image } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

export function Component() {
  return (
    <Box minH="100vh" px={[5, 10]}>
      <Flex
        pos="fixed"
        top={0}
        bottom={0}
        direction="column"
        gap={2.5}
        display={["none", "none", "none", "flex"]}
        w={340}
        pb={10}
      >
        <Flex direction="column" flexGrow={1} gap={2.5} overflowY="auto">
          <Flex align="center" h="125px" shrink={0}>
            <Image
              w="144px"
              h="auto"
              alt="idOS Data Dashboard"
              src={idOSDashboardLogo}
            />
          </Flex>
          <ConnectedWallet />
          <Sidebar />
        </Flex>
      </Flex>
      <Box as="main" maxW={["100%", "100%", "100%", "80vw"]}>
        <Outlet />
      </Box>
    </Box>
  );
}
