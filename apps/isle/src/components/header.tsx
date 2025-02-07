import { HStack, VStack, chakra } from "@chakra-ui/react";
import { DisconnectedIcon } from "./icons/disconnected";
import { Logo } from "./logo";
import { Badge } from "./ui/badge";

export function Header() {
  return (
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
          <Badge bg="neutral.950" size="sm">
            DISCONNECTED
          </Badge>
        </VStack>
      </HStack>
      <DisconnectedIcon color="gray.500" />
    </chakra.header>
  );
}
