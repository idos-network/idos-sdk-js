import { HStack, Spinner, Text } from "@chakra-ui/react";

export const DataLoading = () => {
  return (
    <HStack gap={5} p={5}>
      <Text size="sm">Loading...</Text>
      <Spinner size="sm" />
    </HStack>
  );
};
