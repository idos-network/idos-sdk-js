import { Center, Circle, Heading, VStack } from "@chakra-ui/react";
import { CiClock2 } from "react-icons/ci";

import { Icon } from "@/components/icons/icon";
import { Badge } from "@/components/ui/badge";

export function PendingVerification() {
  return (
    <Center flexDir="column" gap="6">
      <Heading as="h2" fontSize="lg" textAlign="center">
        Your data is now being <br /> processed.
      </Heading>
      <VStack gap="3">
        <Circle
          size="12"
          bg={{
            _dark: "aquamarine.950",
            _light: "aquamarine.400",
          }}
        >
          <Icon
            as={CiClock2}
            color={{
              _dark: "aquamarine.500",
              _light: "aquamarine.700",
            }}
          />
        </Circle>
        <Badge
          bg={{
            _dark: "aquamarine.900",
            _light: "aquamarine.400",
          }}
          color={{
            _dark: "aquamarine.300",
            _light: "aquamarine.700",
          }}
        >
          1 TO 24 HOURS
        </Badge>
      </VStack>
    </Center>
  );
}
