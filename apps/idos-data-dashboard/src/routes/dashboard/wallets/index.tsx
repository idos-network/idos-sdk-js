import { Breadcrumbs } from "#/lib/components/breadcrumbs";
import { Title } from "#/lib/components/title";
import { TitleBar } from "#/lib/components/title-bar";
import { AbsoluteCenter, Box, Button, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { Wallet, useFetchWallets } from "./queries";
import { WalletCard } from "./components/wallet-card";

export function Component() {
  const wallets = useFetchWallets();
  const onDeleteWallet = (wallet: Wallet) => {
    console.log(wallet);
  }

  return (
    <Box>
      <Stack flex={1} gap={2.5} ml={[0, 0, 0, 380]}>
        <Flex align="center" justify="space-between" h={125}>
          <Breadcrumbs items={["Dashboard", "Wallets"]} />
        </Flex>
        <Flex align="center" gap={2.5}>
          <TitleBar>
            <Title>Wallets</Title>
            <Text>
              0
              <Text as="span" mx={1} hideBelow="xl">
                Connected wallets
              </Text>
            </Text>
          </TitleBar>
          <Button colorScheme="green" hideBelow="lg" size="xl">
            Add wallet
          </Button>
        </Flex>
        <Box>
        {wallets.isFetching ? (
            <AbsoluteCenter>
              <Spinner />
            </AbsoluteCenter>
          ) : null}
          {wallets.isSuccess ? (
            <>
              {wallets.data.length === 0 ? (
                <></>
              ) : (
                wallets.data.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    onDeleteWallet={onDeleteWallet}
                  />
                ))
              )}
            </>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

Component.displayName = "DashboardWallets";
