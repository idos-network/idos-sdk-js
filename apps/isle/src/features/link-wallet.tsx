import { Center, Circle, Heading, Image, Link, Text } from "@chakra-ui/react";
import { useState } from "react";
import { LuCheck } from "react-icons/lu";

import { Icon } from "@/components/icons/icon";
import { WalletIcon } from "@/components/icons/wallet";
import { Button } from "@/components/ui";

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
  const address = "0x1234567890123456789012345678901234567890";

  const addWalletLink = `${import.meta.env.VITE_IDOS_DATA_DASHBOARD_URL}/wallets?add-wallet=${address}&callbackUrl=${window.location.href}`;

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
      <Button asChild gap="2" w="full">
        <Link href={addWalletLink} textDecoration="none">
          Link wallet to idOS Dashboard <WalletIcon boxSize="6" />
        </Link>
      </Button>
    </Center>
  );
}
