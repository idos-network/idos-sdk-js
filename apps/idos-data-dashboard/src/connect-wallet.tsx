import idOSDashboardLogo from "#/assets/idos-dashboard-logo.svg";
import idOSLogo from "#/assets/idos-logo.svg";
import Metamask from "#/assets/metamask.svg";
import Near from "#/assets/near.svg";
import {
  Box,
  Button,
  Center,
  Heading,
  Image,
  Text,
  VStack
} from "@chakra-ui/react";

type ConnectWalletProps = {
  onNearConnect: () => Promise<void>;
  onMetamaskConnect: () => Promise<void>;
};

export const ConnectWallet = (props: ConnectWalletProps) => {
  return (
    <Center
      minH="100vh"
      p={6}
      bg={`url('/cubes.png') center center no-repeat`}
      bgSize="cover"
    >
      <VStack
        alignItems="stretch"
        direction="column"
        gap={10}
        minW={["100%", 640]}
        px={[6, 12]}
        py={12}
        bg="neutral.900"
        border="1px solid"
        borderColor="neutral.800"
        shadow="lg"
        rounded="2xl"
      >
        <Box mx="auto">
          <Image alt="idOS Data Dashboard" src={idOSDashboardLogo} />
        </Box>
        <Heading fontWeight="medium" textAlign="center" size="xl">
          Connect your Wallet
        </Heading>
        <VStack alignItems="stretch" gap={3}>
          <Button
            justifyContent="space-between"
            onClick={props.onNearConnect}
            size="2xl"
          >
            Connect with Near
            <Image w={47} alt="Near icon" src={Near} />
          </Button>
          <Button
            justifyContent="space-between"
            onClick={props.onMetamaskConnect}
            size="2xl"
          >
            Connect with Metamask
            <Image alt="Metamask icon" src={Metamask} />
          </Button>
        </VStack>
        <Text
          alignItems="center"
          justifyContent="center"
          gap={2}
          display="flex"
        >
          Powered by <Image alt="idOS" src={idOSLogo} />
        </Text>
      </VStack>
    </Center>
  );
};
