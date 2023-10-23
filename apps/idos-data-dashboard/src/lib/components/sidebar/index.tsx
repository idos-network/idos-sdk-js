import { ComingSoon } from "#/lib/components/coming-soon";
import { NavLink, type LinkProps } from "#/lib/components/link";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";

const SidebarLink = ({
  children,
  disabled,
  ...props
}: LinkProps & { disabled?: boolean }) => {
  return disabled ? (
    <Text
      as="span"
      alignItems="center"
      justifyContent="space-between"
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
      justifyContent="space-between"
      px={7}
      py={3.5}
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
        <SidebarLink to="/">Credentials</SidebarLink>
        <SidebarLink to="/wallets">Wallets</SidebarLink>
        <SidebarLink to="/attributes" disabled>
          Attributes
          <ComingSoon mr={-6} />
        </SidebarLink>
      </VStack>
      <Box mt="auto">
        <Button colorScheme="green" size="xl">
          Disconnect Wallet
        </Button>
      </Box>
    </Flex>
  );
};
