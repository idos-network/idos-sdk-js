import { Center, Circle, Heading, Image, Text } from "@chakra-ui/react";

import { Icon } from "@/components/icons/icon";
import { WalletIcon } from "@/components/icons/wallet";
import { Button } from "@/components/ui";
import { useState } from "react";
import { LuCheck } from "react-icons/lu";

function WalletLinked() {
  return (
    <Center flexDir="column" gap="6">
      <Heading as="h2" fontSize="lg" textAlign="center">
        Wallet linked.
      </Heading>
      <Circle
        size="12"
        bg={{
          _dark: "aquamarine.950",
          _light: "aquamarine.400",
        }}
        boxShadow="md"
      >
        <Icon color="aquamarine.700">
          <LuCheck size="28" />
        </Icon>
      </Circle>
    </Center>
  );
}

export function LinkWallet() {
  const [linked] = useState(false);

  if (linked) {
    return <WalletLinked />;
  }

  return (
    <Center flexDir="column" gap="6">
      <Image src="/link-wallet.svg" alt="Link wallet" />
      <Text color="gray.500" fontSize="sm" textAlign="center">
        Link existing wallet 0x... to your idOS Profile.
      </Text>
      <Button gap="2" w="full">
        Link wallet to idOS Dashboard <WalletIcon boxSize="6" />
      </Button>
    </Center>
  );
}
