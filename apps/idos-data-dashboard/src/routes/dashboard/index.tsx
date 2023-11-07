import idOSDashboardLogo from "#/assets/idos-dashboard-logo.svg";
import { ConnectedWallet } from "#/lib/components/connected-wallet";
import { Sidebar } from "#/lib/components/sidebar";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  IconButton,
  Image,
  useDisclosure
} from "@chakra-ui/react";
import { MenuIcon } from "lucide-react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function Component() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const location = useLocation();
  useEffect(() => {
    onClose();
  }, [location]);

  return (
    <Box
      minH="100vh"
      px={[5, 10]}
      py={{
        base: 5,
        lg: 0
      }}
    >
      <IconButton aria-label="Toggle menu" hideFrom="lg" onClick={onOpen}>
        <MenuIcon size={24} />
      </IconButton>
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
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader />
          <DrawerCloseButton />
          <DrawerBody flex="1" p={0}>
            <Sidebar />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
