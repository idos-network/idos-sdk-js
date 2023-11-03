import { setupNearWalletSelector } from "#/lib/ near/utils.ts";
import { Box, Center, Flex, Image, Text } from "@chakra-ui/react";
import { useMetaMask } from "metamask-react";
import { useEffect, useState } from "react";
import UserWallet from "./assets/user-wallet.svg";

export const ConnectedWallet = () => {
  const [selectorAddress, setSelectorAddress] = useState<string | undefined>();
  const metamask = useMetaMask();

  useEffect(() => {
    const setupAddress = async () => {
      const selector = await setupNearWalletSelector();
      if (!selector.isSignedIn()) {
        return;
      }
      const wallet = await selector.wallet();
      const accounts = await wallet.getAccounts();
      setSelectorAddress(accounts[0].accountId);
    };
    setupAddress();
  }, []);

  const address = selectorAddress ?? metamask.account;

  return (
    <Flex
      align="center"
      gap={5}
      h={78}
      px={5}
      py={3}
      bg="neutral.900"
      rounded="xl"
    >
      <Center w="50px" h="50px" bg="neutral.800" rounded="lg">
        <Image alt={`Connected wallet ${address}`} src={UserWallet} />
      </Center>
      <Box>
        <Text>Connected Wallet</Text>
        <Text color="neutral.600" isTruncated>
          {address}
        </Text>
      </Box>
    </Flex>
  );
};
