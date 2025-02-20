import { HStack, VStack, chakra } from "@chakra-ui/react";

export function Header() {
  return (
    <chakra.header
      px="5"
      borderBottom="1px solid"
      borderColor={{ _light: "gray.200", _dark: "gray.800" }}
    >
      <HStack gap="2" h="16">
        <VStack alignItems="flex-start" gap="1">
          <chakra.span fontSize="lg" fontWeight="semibold">
            🚀 idOS Isle demo
          </chakra.span>
        </VStack>
      </HStack>
    </chakra.header>
  );
}
