import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useMetaMask } from "metamask-react";
import { useTranslation } from "react-i18next";

import { setupMetamask } from "@/lib/metamask";
import { setupMyNearWalletSelector } from "@/lib/near";
import { setupStoreValues } from "@/lib/store";

export function ConnectWallet() {
  const { t } = useTranslation();
  const metamask = useMetaMask();

  const connectMetamask = async () => {
    try {
      await metamask.connect();
      const { signer, publicKey } = await setupMetamask();
      setupStoreValues(signer, publicKey, metamask.account as string);
    } catch (e) {
      console.log(e);
    }
  };

  const connectMyNearWallet = async () => {
    const selector = await setupMyNearWalletSelector();
    const wallet = await selector.wallet("my-near-wallet");
    await wallet.signIn({
      contractId: "test.testnet",
      accounts: [],
    });
  };

  return (
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
          onClick={connectMetamask}
          rounded="full"
          size="lg"
        >
          {t("connect-metamask")}
        </Button>
        <Button colorScheme="blue" onClick={connectMyNearWallet} rounded="full" size="lg">
          {t("connect-mynearwallet")}
        </Button>
        tT
      </Stack>
    </Stack>
  );
}
