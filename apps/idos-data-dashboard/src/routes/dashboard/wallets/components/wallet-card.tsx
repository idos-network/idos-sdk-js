import { Button, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { XIcon } from "lucide-react";

import { idOSWallet } from "../types";

type WalletCardProps = {
  wallet: idOSWallet;
  onDelete: (wallet: idOSWallet) => void;
};

export const WalletCard = ({ wallet, onDelete }: WalletCardProps) => {
  return (
    <HStack align="center" justify="space-between" gap={5} p={5} bg="neutral.900" rounded="xl">
      <HStack gap={5}>
        <Image src="/idos-dashboard-logo-dark.svg" alt="Wallet image" w={50} h={50} />
        <VStack align="stretch" gap={0} overflow="hidden">
          <Text color="neutral.600">Address</Text>
          <Text isTruncated maxW={200}>
            {wallet.address}
          </Text>
        </VStack>
      </HStack>
      <Button leftIcon={<XIcon size={20} />} onClick={() => onDelete(wallet)}>
        Delete
      </Button>
    </HStack>
  );
};
