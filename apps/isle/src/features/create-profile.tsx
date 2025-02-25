import { Center, Heading, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

import { WalletIcon } from "@/components/icons/wallet";
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
      <Text color="gray.500" fontSize="sm" textAlign="center">
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
          onClick={() => {
            return setState("link");
          }}
        >
          Link existing wallet <WalletIcon boxSize="6" />
        </Button>
      </VStack>
    </Center>
  );
}
