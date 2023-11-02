import { ComingSoon } from "#/lib/components/coming-soon";
import { NavLink, type LinkProps } from "#/lib/components/link";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { LogOutIcon } from "lucide-react";
import { KeyRoundIcon } from "../icons/key-round";
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
      gap={2}
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
      gap={2}
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
          Attributes
          <ComingSoon mr={-6} />
        </SidebarLink>
      </VStack>
      <Box mt="auto">
        <Button
          colorScheme="green"
          leftIcon={<LogOutIcon size={24} />}
          size="xl"
        >
          Disconnect Wallet
        </Button>
      </Box>
    </Flex>
  );
};
