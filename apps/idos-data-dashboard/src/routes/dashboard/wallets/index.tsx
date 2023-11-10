import { Breadcrumbs } from "#/lib/components/breadcrumbs";
import { Title } from "#/lib/components/title";
import { TitleBar } from "#/lib/components/title-bar";
import { addressAtom } from "#/lib/state";
import {
  AbsoluteCenter,
  Box,
  Button,
  Flex,
  IconButton,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  VStack
} from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { AddWallet } from "./components/add-wallet";
import { AddWalletCard } from "./components/add-wallet-card";
import { DeleteWallet } from "./components/delete-wallet";
import { WalletCard } from "./components/wallet-card";
import { useFetchWallets, Wallet } from "./queries";

export function Component() {
  const address = useAtomValue(addressAtom);
  const wallets = useFetchWallets({
    enabled: !!address
  });

  const [wallet, setWallet] = useState<Wallet | undefined>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAddWalletOpen,
    onOpen: onAddWalletOpen,
    onClose: onAddWalletClose
  } = useDisclosure();

  const handleDeleteWalletClose = () => {
    setWallet(undefined);
    onClose();
  };

  const onDeleteWallet = async (wallet: Wallet) => {
    setWallet(wallet);
    onOpen();
  };

  const handleOnAddWalletOpen = () => {
    onAddWalletOpen();
  };

  const handleOnAddWalletClose = () => {
    onAddWalletClose();
  };

  if (!address) {
    return (
      <Stack flex={1} gap={2.5} ml={[0, 0, 0, 380]}>
        <Flex align="center" justify="space-between" h={[82, 125]}>
          <Breadcrumbs items={["Dashboard", "Wallets"]} />
        </Flex>
        <Flex align="center" gap={2.5}>
          <TitleBar>
            <Title>Wallets</Title>
            <>
              <IconButton
                w="60px"
                h="60px"
                p={0}
                aria-label="Add wallet"
                colorScheme="green"
                hideFrom="lg"
                onClick={handleOnAddWalletOpen}
                size="xl"
              >
                <PlusIcon size={24} />
              </IconButton>
              <Button
                colorScheme="green"
                hideBelow="lg"
                leftIcon={<PlusIcon size={24} />}
                onClick={handleOnAddWalletOpen}
                size="xl"
              >
                Add wallet
              </Button>
            </>
          </TitleBar>
        </Flex>
        <AddWalletCard onAddWallet={handleOnAddWalletOpen} />
      </Stack>
    );
  }

  return (
    <Box>
      <Stack flex={1} gap={2.5} ml={[0, 0, 0, 380]}>
        <Flex align="center" justify="space-between" h={[82, 125]}>
          <Breadcrumbs items={["Dashboard", "Wallets"]} />
        </Flex>
        <Flex align="center" gap={2.5}>
          <TitleBar>
            <Title>Wallets</Title>
            {wallets.isFetching ? (
              <Spinner size="sm" />
            ) : (
              <Text>
                {wallets.data?.length || 0}
                <Text as="span" mx={1} hideBelow="xl">
                  Connected wallet(s)
                </Text>
              </Text>
            )}
          </TitleBar>
          {wallets.isSuccess ? (
            <>
              <IconButton
                w="60px"
                h="60px"
                p={0}
                aria-label="Add wallet"
                colorScheme="green"
                hideFrom="lg"
                onClick={handleOnAddWalletOpen}
                size="xl"
              >
                <PlusIcon size={24} />
              </IconButton>
              <Button
                colorScheme="green"
                hideBelow="lg"
                leftIcon={<PlusIcon size={24} />}
                onClick={handleOnAddWalletOpen}
                size="xl"
              >
                Add wallet
              </Button>
            </>
          ) : null}
        </Flex>
        <Box>
          {wallets.isFetching ? (
            <AbsoluteCenter>
              <Spinner />
            </AbsoluteCenter>
          ) : null}
          {wallets.isSuccess ? (
            <VStack alignItems="stretch" gap={2.5}>
              {!wallets.data ? (
                <AddWalletCard onAddWallet={handleOnAddWalletOpen} />
              ) : (
                wallets.data.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    onDeleteWallet={onDeleteWallet}
                  />
                ))
              )}
            </VStack>
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

      <AddWallet isOpen={isAddWalletOpen} onClose={handleOnAddWalletClose} />
    </Box>
  );
}

Component.displayName = "DashboardWallets";
