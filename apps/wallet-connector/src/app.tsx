import { Badge, Button, Center, Heading, Text, VStack } from "@chakra-ui/react";

import { useIDOSClient } from "./idOS.provider";
import { useWalletConnector } from "./wallet-connector.provider";

function App() {
  const walletConnector = useWalletConnector();
  const idOSClient = useIDOSClient();

  if (walletConnector.isConnected && walletConnector.connectedWallet) {
    const wallet = walletConnector.connectedWallet;
    return (
      <Center h="100dvh" flexDir="column" gap="5">
        <VStack gap="3" align="center">
          <Heading fontSize="2xl">Connected Wallet</Heading>
          <Badge colorPalette="green" size="lg">
            {wallet.type.toUpperCase()} Connected
          </Badge>
          <Text fontSize="sm" color="gray.600">
            {wallet.address.slice(0, wallet.type === "near" ? 10 : 6)}...
            {wallet.type !== "near" && wallet.address.slice(-4)}
          </Text>
        </VStack>

        <VStack gap="3" align="center">
          <Heading fontSize="lg">idOS Status</Heading>
          <Badge colorPalette={idOSClient.state === "logged-in" ? "green" : "yellow"} size="md">
            {idOSClient.state === "logged-in" ? "Connected to idOS" : `idOS: ${idOSClient.state}`}
          </Badge>
        </VStack>

        <VStack gap="3" align="stretch" w="300px">
          <Button onClick={() => walletConnector.disconnect()} colorPalette="red">
            Disconnect Wallet
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Center h="100dvh" flexDir="column" gap="5">
      <Heading fontSize="2xl">Wallet Connector Playground</Heading>

      <VStack gap="3" align="stretch" w="300px">
        <Button onClick={() => walletConnector.connectEthereum()} colorScheme="blue" size="lg">
          Connect with REOWN
        </Button>
        <Button onClick={() => walletConnector.connectNear()} colorScheme="green" size="lg">
          Connect with NEAR
        </Button>
        <Button onClick={() => walletConnector.connectStellar()} colorScheme="purple" size="lg">
          Connect with STELLAR
        </Button>
      </VStack>
    </Center>
  );
}

export default App;
