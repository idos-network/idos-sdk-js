import { Center, Heading, Image, VStack } from "@chakra-ui/react";

import { Button } from "@/components/ui";
import { injected, useConnect } from "wagmi";

export function NotConnected() {
  const { connect, isPending } = useConnect();
  return (
    <Center flexDir="column" gap="6">
      <VStack gap="3">
        <Heading fontSize="2xl" fontWeight="bold">
          Own your data.
        </Heading>
        <Image src="/lock.svg" alt="Not connected" />
      </VStack>
      <Button
        w="full"
        loading={isPending}
        loadingText="Connecting..."
        onClick={() => {
          connect({ connector: injected() });
        }}
      >
        Connect idOS Profile
      </Button>
    </Center>
  );
}
