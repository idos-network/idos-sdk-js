import { Center, Heading, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui";

interface ErrorFallbackProps {
  error: Error;
}

export function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <Center flexDir="column" gap="6">
      <Heading as="h2" fontSize="lg" textAlign="center">
        There’s been an error.
      </Heading>
      <Text color="gray.500" fontSize="sm" textAlign="center">
        {error.message}
      </Text>
      <Button w="full">Return to previous state</Button>
    </Center>
  );
}
