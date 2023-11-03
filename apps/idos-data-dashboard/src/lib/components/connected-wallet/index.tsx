import { Box, Center, Flex, Image, Text } from "@chakra-ui/react";
import UserWallet from "./assets/user-wallet.svg";

export const ConnectedWallet = ({ address }: { address: string }) => {
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
