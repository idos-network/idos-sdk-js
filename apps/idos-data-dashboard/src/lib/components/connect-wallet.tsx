import { Button, Center, Heading, Stack, Text } from "@chakra-ui/react";
import { useMetaMask } from "metamask-react";
import { useTranslation } from "react-i18next";

type ConnectWalletProps = {
  onMetamaskConnect?: () => void;
  onNearConnect?: () => void;
};

export function ConnectWallet(props: ConnectWalletProps) {
  const { t } = useTranslation();
  const metamask = useMetaMask();
  return (
    <Center minH="100vh">
      <Stack
        gap={[6, 8]}
        w={["auto", 500]}
        mx="auto"
        p={10}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="2xl"
        shadow="md"
      >
        <Stack gap={2}>
          <Heading as="h1" fontWeight="black" size="xl">
            {t("connect-your-wallet")}
          </Heading>
          <Text color="gray.500" fontSize="sm" fontWeight="semibold">
            {t("start-by-connecting-your-wallet-to-the-dashboard")}
          </Text>
        </Stack>
        <Stack gap={4}>
          <Button
            colorScheme="orange"
            isLoading={metamask.status === "connecting"}
            onClick={props.onMetamaskConnect}
            rounded="full"
            size="lg"
          >
            {t("connect-with-metamask")}
          </Button>
          <Button colorScheme="blue" onClick={props.onNearConnect} rounded="full" size="lg">
            {t("connect-with-near")}
          </Button>
          tT
        </Stack>
      </Stack>
    </Center>
  );
}
