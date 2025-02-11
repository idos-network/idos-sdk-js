import { Center, Circle, Heading, Image, Link, Text } from "@chakra-ui/react";

import { Icon } from "@/components/icons/icon";
import { WalletIcon } from "@/components/icons/wallet";
import { Button } from "@/components/ui";
import { useState } from "react";
import { LuCheck } from "react-icons/lu";
import { useAccount } from "wagmi";

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
  const { address } = useAccount();

  const addWalletLink = `${import.meta.env.VITE_IDOS_DATA_DASHBOARD_URL}/wallets?add-wallet=${address}&callbackUrl=${window.location.href}`;

  if (linked) {
    return <WalletLinked />;
  }

  return (
    <Center flexDir="column" gap="6">
      <Image src="/link-wallet.svg" alt="Link wallet" />
      <Text
        color={{
          _dark: "neutral.950",
          _light: "neutral.50",
        }}
        fontSize="sm"
        textAlign="center"
        fontWeight="medium"
      >
        {address}
      </Text>
      <Text
        display="block"
        color="neutral.500"
        fontSize="sm"
        textAlign="center"
        fontWeight="medium"
        my="3"
      >
        You will be redirected to idOS Dashboard.
      </Text>
      <Link href={addWalletLink} w="full">
        <Button gap="2" w="full">
          Link wallet to idOS Dashboard <WalletIcon boxSize="6" />
        </Button>
      </Link>
    </Center>
  );
}
