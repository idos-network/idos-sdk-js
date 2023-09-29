import { Box, Flex, Text } from "@chakra-ui/react";
import { ZapIcon } from "lucide-react";

export function Header() {
  return (
    <Box as="header" borderBottom="1px solid" borderBottomColor="gray.100">
      <Flex align="center" justify="space-between" maxW="container.xl" h={16} mx="auto" px={6}>
        <Flex align="center" gap={1}>
          <ZapIcon />
          <Text as="span" fontWeight="semibold" hideBelow="sm">
            idOS DDP
          </Text>
        </Flex>
        <Box />
      </Flex>
    </Box>
  );
}
