import {
  Button,
  HStack,
  Heading,
  IconButton,
  List,
  ListItem,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import type { idOSWallet } from "@idos-network/idos-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { DataError } from "@/components/data-error";
import { DataLoading } from "@/components/data-loading";
import { NoData } from "@/components/no-data";
import { useIdOS } from "@/core/idos";

import { useWalletSelector } from "@/core/near";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { AddWallet } from "./components/add-wallet";
import { DeleteWallet } from "./components/delete-wallet";
import { WalletCard } from "./components/wallet-card";

const useFetchWallets = () => {
  const { sdk } = useIdOS();

  return useQuery({
    queryKey: ["wallets"],
    queryFn: ({ queryKey: [tableName] }) => sdk.data.list<idOSWallet>(tableName),
    select: (data) => Object.groupBy(data, (wallet) => wallet.address),
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

const LinkWalletError = () => {
  return (
    <Text color="red.500" fontSize="sm">
      You can't link a wallet to an account with no wallets. You'll be redirected back...
    </Text>
  );
};

const WalletsList = () => {
  const wallets = useFetchWallets();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [walletsToDelete, setWalletToDelete] = useState<idOSWallet[] | undefined>([]);
  const { address: ethAddress } = useAccount();
  const { accounts } = useWalletSelector();

  const nearAddress = accounts?.[0]?.accountId;

  const address = ethAddress || nearAddress;

  const handleDelete = (address: string) => {
    const walletsToDelete = wallets.data?.[address];

    if (!walletsToDelete) return;

    setWalletToDelete(walletsToDelete);
    onOpen();
  };

  const handleClose = () => {
    setWalletToDelete([]);
    onClose();
  };

  if (wallets.isFetching) {
    return <DataLoading />;
  }

  if (wallets.isError) {
    return <DataError onRetry={wallets.refetch} />;
  }

  if (wallets.isSuccess) {
    const addresses = Object.keys(wallets.data);

    return (
      <>
        <List id="wallets-list" display="flex" flexDir="column" gap={2.5} flex={1}>
          {addresses.map((walletAddress) => (
            <ListItem key={walletAddress}>
              <WalletCard
                address={walletAddress}
                onDelete={handleDelete}
                isDisabled={address?.toLowerCase() === walletAddress.toLowerCase()}
              />
            </ListItem>
          ))}
        </List>
        <DeleteWallet isOpen={isOpen} wallets={walletsToDelete} onClose={handleClose} />
      </>
    );
  }
};

export function Component() {
  const { hasProfile } = useIdOS();
  const [searchParams] = useSearchParams();
  const walletToAdd = searchParams.get("add-wallet") || undefined;
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: !!walletToAdd && hasProfile });

  const handleWalletAdded = () => {
    if (callbackUrl) location.href = callbackUrl;
  };

  useEffect(() => {
    if (walletToAdd && !hasProfile && callbackUrl) {
      setTimeout(() => {
        location.href = callbackUrl;
      }, 5_000);
    }
  }, [walletToAdd, hasProfile, callbackUrl]);

  if (!hasProfile) {
    return <Navigate to="/" />;
  }

  return (
    <VStack align="stretch" flex={1} gap={2.5}>
      <HStack
        justifyContent="space-between"
        h={{
          base: 14,
          lg: 20,
        }}
        p={5}
        bg="neutral.900"
        rounded="xl"
      >
        <Heading
          as="h1"
          fontSize={{
            base: "x-large",
            lg: "xx-large",
          }}
        >
          Wallets
        </Heading>
        {hasProfile ? (
          <HStack>
            <Button
              id="add-wallet-button"
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
                  queryKey: ["wallets"],
                });
              }}
            />
          </HStack>
        ) : (
          false
        )}
      </HStack>
      {hasProfile ? <WalletsList /> : <NoWallets />}
      {walletToAdd && !hasProfile ? <LinkWalletError /> : null}
      <AddWallet
        isOpen={isOpen}
        onClose={onClose}
        defaultValue={walletToAdd}
        onWalletAdded={handleWalletAdded}
      />
    </VStack>
  );
}
Component.displayName = "Wallets";
