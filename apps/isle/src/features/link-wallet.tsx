import { Center, Circle, Heading, Image, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck } from "react-icons/lu";

import { Icon } from "@/components/icons/icon";
import { WalletIcon } from "@/components/icons/wallet";
import { Button } from "@/components/ui";
import { useIsleStore } from "@/store";

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
  const address = useIsleStore((state) => state.address);
  const linkWallet = useIsleStore((state) => state.linkWallet);

  if (linked) {
    return <WalletLinked />;
  }

  return (
    <Center flexDir="column" gap="3">
      <Image src="/link-wallet.svg" alt="Link wallet" />
      <Text
        color={{
          _dark: "neutral.50",
          _light: "neutral.950",
        }}
        fontSize="xs"
        textAlign="center"
        fontWeight="medium"
      >
        {address}
      </Text>
      <Text
        display="block"
        color="neutral.500"
        fontSize="xs"
        textAlign="center"
        fontWeight="medium"
      >
        You will be redirected to idOS Dashboard.
      </Text>
      <Button
        gap="2"
        w="full"
        onClick={() => {
          linkWallet();
        }}
      >
        Link wallet to idOS Dashboard <WalletIcon boxSize="6" />
      </Button>
    </Center>
  );
}
