import { Center, Heading, Image, VStack } from "@chakra-ui/react";

import { Button } from "@/components/ui";

export function NotConnected() {
  return (
    <Center flexDir="column" gap="6">
      <VStack gap="3">
        <Heading fontSize="2xl" fontWeight="bold">
          Own your data.
        </Heading>
        <Image src="/lock.svg" alt="Not connected" />
      </VStack>
      <Button w="full">Connect idOS Profile</Button>
    </Center>
  );
}
