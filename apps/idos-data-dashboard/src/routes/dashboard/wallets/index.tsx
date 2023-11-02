import { Breadcrumbs } from "#/lib/components/breadcrumbs";
import { Title } from "#/lib/components/title";
import { TitleBar } from "#/lib/components/title-bar";
import {
  AbsoluteCenter,
  Box,
  Button,
  Flex,
  Spinner,
  Stack,
  Text,
  useDisclosure
} from "@chakra-ui/react";
import { useState } from "react";
import { DeleteWallet } from "./components/delete-wallet";
import { WalletCard } from "./components/wallet-card";
import { Wallet, useFetchWallets } from "./queries";

export function Component() {
  const wallets = useFetchWallets();
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleDeleteWalletClose = () => {
    setWallet(undefined);
    onClose();
  };
  const onDeleteWallet = async (wallet: Wallet) => {
    setWallet(wallet);
    onOpen();
  };

  return (
    <Box>
      <Stack flex={1} gap={2.5} ml={[0, 0, 0, 380]}>
        <Flex align="center" justify="space-between" h={125}>
          <Breadcrumbs items={["Dashboard", "Wallets"]} />
        </Flex>
        <Flex align="center" gap={2.5}>
          <TitleBar>
            <Title>Wallets</Title>
            {wallets.isLoading ? (
              <Spinner size="sm" />
            ) : (
              <Text>
                {wallets.data?.length}
                <Text as="span" mx={1} hideBelow="xl">
                  Connected wallet(s)
                </Text>
              </Text>
            )}
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
      {wallet ? (
        <DeleteWallet
          isOpen={isOpen}
          wallet={wallet}
          onClose={handleDeleteWalletClose}
        />
      ) : null}
    </Box>
  );
}

Component.displayName = "DashboardWallets";
