import { Center, Heading, Text } from "@chakra-ui/react";

export function PendingVerification() {
  return (
    <Center flexDir="column" gap="6">
      <Heading as="h2" fontSize="lg" textAlign="center">
        Your data is now being <br /> processed.
      </Heading>
      <Text color="gray.500" fontSize="sm" textAlign="center">
        This verification process takes from 1h to 24h.
      </Text>
    </Center>
  );
}
