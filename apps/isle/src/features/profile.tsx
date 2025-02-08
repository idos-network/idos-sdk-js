import { Button, Center, Heading } from "@chakra-ui/react";
import { useDisconnect } from "wagmi";

export function Profile() {
  const { disconnect } = useDisconnect();

  return (
    <Center flexDir="column" gap="6">
      <Heading fontSize="2xl" fontWeight="bold">
        User profile
      </Heading>
      <Button
        colorPalette="green"
        variant="subtle"
        color="aquamarine"
        w="full"
        onClick={() => disconnect()}
      >
        Disconnect
      </Button>
    </Center>
  );
}
