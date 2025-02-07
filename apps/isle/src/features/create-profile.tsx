import { Center, Heading, Text, VStack } from "@chakra-ui/react";

import { WalletIcon } from "@/components/icons/wallet";
import { Button } from "@/components/ui";
import { useState } from "react";
import { CreateProfileSteps } from "./create-profile-steps";

export function CreateProfile() {
  const [isCreateMode, setIsCreateMode] = useState(true);

  if (isCreateMode) return <CreateProfileSteps />;

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
        <Button onClick={() => setIsCreateMode(true)}>Create idOS profile</Button>
        <Button gap="2">
          Link existing wallet <WalletIcon boxSize="6" />
        </Button>
      </VStack>
    </Center>
  );
}
