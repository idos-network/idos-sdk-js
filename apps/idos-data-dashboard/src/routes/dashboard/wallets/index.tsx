import {
  Button,
  HStack,
  Heading,
  IconButton,
  List,
  ListItem,
  VStack,
  useDisclosure
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";

import { AddWallet } from "./components/add-wallet";
import { WalletCard } from "./components/wallet-card";
import { idOSWallet } from "./types";

const useFetchWallets = () => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["wallets"],
    queryFn: ({ queryKey: [tableName] }) => sdk.data.list<idOSWallet>(tableName)
  });
};

const NoWallets = () => {
  return (
    <NoData
      title="You have 0 wallets added."
      subtitle="Create your first wallet and store it on the idOS."
      cta="Add a wallet"
    />
  );
};

const WalletsList = () => {
  const wallets = useFetchWallets();

  if (wallets.isLoading) {
    return <DataLoading />;
  }

  if (wallets.isError) {
    return <DataError onRetry={wallets.refetch} />;
  }

  if (wallets.isSuccess) {
    return (
      <List display="flex" flexDir="column" gap={2.5} flex={1}>
        {wallets.data.map((wallet) => (
          <ListItem key={wallet.id}>
            <WalletCard wallet={wallet} />
          </ListItem>
        ))}
      </List>
    );
  }
};

export function Component() {
  const { hasProfile } = useIdOS();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <VStack align="stretch" flex={1} gap={2.5}>
      <HStack
        justifyContent="space-between"
        h={{
          base: 14,
          lg: 20
        }}
        p={5}
        bg="neutral.900"
        rounded="xl"
      >
        <Heading
          as="h1"
          fontSize={{
            base: "x-large",
            lg: "xx-large"
          }}
        >
          Wallets
        </Heading>
        {hasProfile ? (
          <>
            <Button
              colorScheme="green"
              leftIcon={<PlusIcon size={24} />}
              hideBelow="lg"
              onClick={onOpen}
            >
              Add wallet
            </Button>
            <IconButton colorScheme="green" aria-label="Add wallet" hideFrom="lg" onClick={onOpen}>
              <PlusIcon size={24} />
            </IconButton>
          </>
        ) : (
          false
        )}
      </HStack>
      {hasProfile ? <WalletsList /> : <NoWallets />}
      <AddWallet isOpen={isOpen} onClose={onClose} />
    </VStack>
  );
}
Component.displayName = "Wallets";
