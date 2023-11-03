import { setupNearWalletSelector } from "#/lib/ near/utils";
import { ComingSoon } from "#/lib/components/coming-soon";
import { NavLink, type LinkProps } from "#/lib/components/link";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { WalletSelector } from "@near-wallet-selector/core";
import { useEffect, useState } from "react";
import { AttributeIcon } from "../icons/attribute";
import { KeyRoundIcon } from "../icons/key-round";
import { SignOutIcon } from "../icons/sign-out";
import { WalletIcon } from "../icons/wallet";

const SidebarLink = ({
  children,
  disabled,
  ...props
}: LinkProps & { disabled?: boolean }) => {
  return disabled ? (
    <Text
      as="span"
      alignItems="center"
      gap={4}
      display="flex"
      px={7}
      py={3}
      color="neutral.600"
      bg="neutral.900"
      rounded="xl"
    >
      {children}
    </Text>
  ) : (
    <NavLink
      display="flex"
      alignItems="center"
      px={7}
      py={3.5}
      gap={4}
      bg="neutral.900"
      _hover={{
        bg: "neutral.950"
      }}
      rounded="xl"
      _activeLink={{
        bg: "neutral.950"
      }}
      {...props}
    >
      {children}
    </NavLink>
  );
};

export const Sidebar = () => {
  const [selector, setSelector] = useState<WalletSelector | undefined>();

  useEffect(() => {
    const setupSelector = async () => {
      const selector = await setupNearWalletSelector();
      setSelector(selector);
    };
    setupSelector();
  }, []);
  const onDisconnect = async () => {
    if (!selector) {
      return;
    }
    const wallet = await selector.wallet();
    await wallet.signOut();
    window.location.reload();
  };

  return (
    <Flex
      as="nav"
      direction="column"
      flex="1"
      p={5}
      bg="neutral.900"
      rounded="xl"
    >
      <VStack align="stretch" gap={2}>
        <SidebarLink to="/">
          <KeyRoundIcon w={6} h={6} stroke="neutral.100" />
          Credentials
        </SidebarLink>
        <SidebarLink to="/wallets">
          <WalletIcon w={6} h={6} stroke="neutral.100" />
          Wallets
        </SidebarLink>
        <SidebarLink to="/attributes" disabled>
          <AttributeIcon w={6} h={6} stroke="neutral.600" />
          Attributes
          <ComingSoon mr={-6} />
        </SidebarLink>
      </VStack>
      <Box mt="auto">
        {selector && selector.isSignedIn() ? (
          <Button
            colorScheme="green"
            leftIcon={
              <SignOutIcon
                w={6}
                h={6}
                stroke="neutral.600"
                strokeWidth={1.5}
                fill="none"
              />
            }
            onClick={onDisconnect}
            size="xl"
          >
            Disconnect Wallet
          </Button>
        ) : null}
      </Box>
    </Flex>
  );
};
