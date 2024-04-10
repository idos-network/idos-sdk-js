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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, RotateCw } from "lucide-react";
import { useState } from "react";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";

import { AddWallet } from "./components/add-wallet";
import { DeleteWallet } from "./components/delete-wallet";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletToDelete, setWalletToDelete] = useState<idOSWallet | null>(null);

  const handleDelete = (wallet: idOSWallet) => {
    setWalletToDelete(wallet);
    onOpen();
  };

  const handleClose = () => {
    setWalletToDelete(null);
    onClose();
  };

  if (wallets.isLoading) {
    return <DataLoading />;
  }

  if (wallets.isError) {
    return <DataError onRetry={wallets.refetch} />;
  }

  if (wallets.isSuccess) {
    return (
      <>
        <List
          display="flex"
          flexDir="column"
          gap={2.5}
          flex={1}
          opacity={wallets.isRefetching ? 0.5 : 1}
          transition={"opacity 0.15s ease"}
        >
          {wallets.data.map((wallet) => (
            <ListItem key={wallet.id}>
              <WalletCard wallet={wallet} onDelete={handleDelete} />
            </ListItem>
          ))}
        </List>
        <DeleteWallet isOpen={isOpen} wallet={walletToDelete} onClose={handleClose} />
      </>
    );
  }
};

export function Component() {
  const { hasProfile } = useIdOS();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();

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
          <HStack>
            <Button
              colorScheme="green"
              leftIcon={<PlusIcon size={24} />}
              hideBelow="lg"
              onClick={onOpen}
            >
              Add wallet
            </Button>
            <IconButton
              aria-label="Add wallet"
              colorScheme="green"
              icon={<PlusIcon size={24} />}
              hideFrom="lg"
              onClick={onOpen}
            />
            <IconButton
              aria-label="Refresh wallets"
              icon={<RotateCw size={18} />}
              onClick={() => {
                queryClient.refetchQueries({
                  queryKey: ["wallets"]
                });
              }}
            />
          </HStack>
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
