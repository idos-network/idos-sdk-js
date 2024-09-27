import {
  Box,
  Button,
  Center,
  Link as ChakraLink,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Image,
  type LinkProps,
  List,
  ListItem,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  CogIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LogOutIcon,
  MenuIcon,
  Wallet2Icon,
} from "lucide-react";
import { useEffect, useId } from "react";
import { NavLink, type NavLinkProps, Outlet, useLocation, useMatches } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";

import { useIdOS } from "@/core/idos";
import { useWalletSelector } from "@/core/near";

const ConnectedWallet = () => {
  const { address } = useIdOS();
  return (
    <HStack alignItems="center" gap={5} h={20}>
      <Center flexShrink={0} w={50} h={50} bg="neutral.800" rounded="lg">
        <Image
          alt={`Connected wallet ${address}`}
          src="/idos-dashboard-logo-dark.svg"
          w={50}
          h={50}
          loading="eager"
        />
      </Center>
      <Box>
        <Text>Connected Wallet</Text>
        <Text maxW={180} color="neutral.600" isTruncated>
          {address}
        </Text>
      </Box>
    </HStack>
  );
};

const Link = (props: NavLinkProps & LinkProps) => {
  return <ChakraLink as={NavLink} {...props} />;
};

const ListItemLink = (props: NavLinkProps & LinkProps) => {
  return (
    <Link
      {...props}
      px={6}
      py={3}
      display="flex"
      alignItems="center"
      gap={5}
      rounded="xl"
      _hover={{ bg: "neutral.950" }}
      _activeLink={{
        bg: "neutral.950",
      }}
    />
  );
};

const DisconnectButton = () => {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { selector } = useWalletSelector();
  const queryClient = useQueryClient();

  const handleDisconnect = async () => {
    if (isConnected) disconnect();
    if (selector.isSignedIn()) (await selector.wallet()).signOut();
    queryClient.removeQueries();
  };

  return (
    <Button
      id="disconnect-wallet-btn"
      colorScheme="green"
      leftIcon={<LogOutIcon size={24} strokeWidth="1.5" />}
      onClick={handleDisconnect}
    >
      Disconnect wallet
    </Button>
  );
};

const Breadcrumbs = () => {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => Boolean((match.handle as { crumb: () => string })?.crumb))
    .map((match) => (match.handle as { crumb: () => string })?.crumb());

  const items = ["Dashboard", ...crumbs];
  return (
    <List display="flex" alignItems="center" gap={[2.5, 5]}>
      {items.map((item, index) => {
        return (
          <ListItem key={item} display="flex" alignItems="center" gap={[2.5, 5]}>
            <Text as="span" fontSize="small" px={4} py={2} bg="neutral.800" rounded="full">
              {item}
            </Text>
            {index !== items.length - 1 ? <ChevronRightIcon size={18} /> : null}
          </ListItem>
        );
      })}
    </List>
  );
};

export function Component() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const { hasProfile } = useIdOS();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Close the sidebar whenever `location` changes.
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location]);

  return (
    <Flex minH="100dvh">
      <VStack
        as="nav"
        alignItems="stretch"
        pos="sticky"
        top="0"
        height="100dvh"
        w={380}
        hideBelow="lg"
      >
        <VStack alignItems="stretch" flex={1} p={5} gap={5}>
          <Link to="/" display="flex" alignItems="center" h={100}>
            <Image
              src="/idos-dashboard-logo.svg"
              alt="idOS Dashboard logo"
              w={160}
              h="auto"
              loading="eager"
            />
          </Link>
          <VStack alignItems="stretch" flex={1} gap={2.5}>
            <Box px={5} bg="neutral.900" rounded="xl">
              <ConnectedWallet />
            </Box>
            <VStack as="nav" alignItems="stretch" flex={1} p={5} bg="neutral.900" rounded="xl">
              <List display="flex" flexDir="column" gap={1.5}>
                <ListItem>
                  <ListItemLink to="/">
                    <KeyRoundIcon size={24} strokeWidth="1.5" />
                    <Text as="span">Credentials</Text>
                  </ListItemLink>
                </ListItem>
                <ListItem>
                  <ListItemLink to="/wallets">
                    <Wallet2Icon size={24} strokeWidth="1.5" />
                    <Text as="span">Wallets</Text>
                  </ListItemLink>
                </ListItem>
              </List>
              <VStack mt="auto" gap={5} alignItems="stretch">
                {hasProfile ? (
                  <List display="flex" flex={1} flexDir="column" gap={1.5}>
                    <ListItemLink to="/settings">
                      <CogIcon size={24} strokeWidth="1" />
                      <Text as="span">Settings</Text>
                    </ListItemLink>
                  </List>
                ) : null}
                <DisconnectButton />
              </VStack>
            </VStack>
          </VStack>
        </VStack>
      </VStack>
      <VStack as="main" alignItems="stretch" flex={1} p={5} gap={0}>
        <Flex
          as="header"
          alignItems="center"
          justifyContent="space-between"
          h={{
            base: 10,
            lg: 120,
          }}
          mb={{
            base: 5,
            lg: 0,
          }}
        >
          <IconButton aria-label="Open menu" onClick={onOpen} hideFrom="lg">
            <MenuIcon size={24} strokeWidth="1.5" />
          </IconButton>
          <Breadcrumbs />
        </Flex>
        <Outlet />
      </VStack>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="neutral.900">
          <DrawerCloseButton />
          <DrawerHeader>
            <Link to="/" display="flex" alignItems="center" h={100}>
              <Image
                src="/idos-dashboard-logo.svg"
                alt="idOS Dashboard logo"
                w={120}
                h="auto"
                loading="eager"
              />
            </Link>
          </DrawerHeader>
          <DrawerBody>
            <Box mb={5}>
              <ConnectedWallet />
            </Box>
            <List display="flex" flexDir="column" gap={1.5}>
              <ListItem>
                <ListItemLink to="/">
                  <KeyRoundIcon size={24} strokeWidth="2.5" />
                  <Text as="span">Credentials</Text>
                </ListItemLink>
              </ListItem>
              <ListItem>
                <ListItemLink to="/wallets">
                  <Wallet2Icon size={24} strokeWidth="1.5" />
                  <Text as="span">Wallets</Text>
                </ListItemLink>
              </ListItem>
            </List>
          </DrawerBody>
          <DrawerFooter alignItems="stretch" justifyContent="start" flexDir="column" gap={5}>
            {hasProfile ? (
              <List display="flex" flex={1} flexDir="column" gap={1.5}>
                <ListItemLink to="/settings">
                  <CogIcon size={24} strokeWidth="1" />
                  <Text as="span">Settings</Text>
                </ListItemLink>
              </List>
            ) : null}

            <DisconnectButton />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Flex pos="fixed" right={5} bottom={5} gap="2" bg="neutral.900" p={5} rounded="lg">
        <Button
          as={ChakraLink}
          isExternal
          href="https://drive.google.com/file/d/1CypYsXx--xCT05cjEbYE4TCT9ymF698r/view?usp=drive_link"
          target="_blank"
          color="green.200"
          display="inline-flex"
          alignItems="center"
          gap={2}
        >
          Privacy Policy <ExternalLinkIcon size={16} />
        </Button>
        <Button
          as={ChakraLink}
          isExternal
          href="https://drive.google.com/file/d/1OIoC1Y0TwBf-fR5g6FtZyvmjyv5iWY67/view?usp=drive_link"
          target="_blank"
          color="green.200"
          display="inline-flex"
          alignItems="center"
          gap={2}
        >
          User Agreement <ExternalLinkIcon size={16} />
        </Button>
      </Flex>
    </Flex>
  );
}
