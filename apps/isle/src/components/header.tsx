import { type BadgeProps, HStack, VStack, chakra } from "@chakra-ui/react";
import { Logo } from "./logo";
import { Badge } from "./ui/badge";
import { DisconnectedIcon } from "./icons/disconnected";

export function Header({ badgeProps }: { badgeProps?: BadgeProps }) {
  return (
    <>
      <chakra.header
        id="mini-header"
        display={{ base: "flex", sm: "none" }}
        justifyContent="space-between"
        alignItems="center"
      >
        <Logo />
        <DisconnectedIcon color="gray.500" />
      </chakra.header>
      <chakra.header
        display={{ base: "none", sm: "flex" }}
        id="header"
        alignItems="start"
        justifyContent="space-between"
        gap="5"
      >
        <HStack gap="2">
          <Logo />
          <VStack alignItems="flex-start" gap="1">
            <chakra.span fontSize="lg" fontWeight="semibold">
              idOS
            </chakra.span>
            <Badge colorPalette="gray" size="sm" {...badgeProps} />
          </VStack>
        </HStack>
        <DisconnectedIcon color="gray.500" />
      </chakra.header>
    </>
  );
}
