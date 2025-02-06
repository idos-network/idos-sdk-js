import { chakra } from "@chakra-ui/react";
import { Button } from "./ui";

export function Disconnected() {
  return (
    <chakra.div>
      <chakra.h2 fontSize="2xl" textAlign="center" fontWeight="semibold" mb="3">
        Own your data.
      </chakra.h2>
      <chakra.img src="/lock.svg" alt="lock" />

      <Button mt="6" w="full">
        Connect idOS Profile
      </Button>
    </chakra.div>
  );
}
