import { Center, Heading, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

import { Button } from "@/components/ui";
import { CreateProfileSteps } from "@/features/create-profile-steps";
import { LinkWallet } from "@/features/link-wallet";

type State = "create" | "link" | null;

export function CreateProfile() {
  const [state, setState] = useState<State>(null);

  if (state === "create") {
    return <CreateProfileSteps />;
  }

  if (state === "link") {
    return <LinkWallet />;
  }

  return (
    <Center flexDir="column" gap="6">
      <Heading as="h2" fontSize="2xl" textAlign="center">
        Welcome to the identity <br />
        layer of web3.
      </Heading>
      <Text color="muted.fg" fontSize="sm" textAlign="center">
        Create an idOS profile or link an existing wallet to your idOS account to use advanced
        features.
      </Text>
      <VStack gap="2" align="stretch" w="full">
        <Button
          onClick={() => {
            return setState("create");
          }}
        >
          Create idOS profile
        </Button>
        <Button
          gap="2"
          bg={{
            _hover: "neutral.300",
            _dark: {
              base: "neutral.50",
            },
            _light: {
              base: "muted.bg",
            },
          }}
          onClick={() => {
            return setState("link");
          }}
        >
          Login
        </Button>
      </VStack>
    </Center>
  );
}
