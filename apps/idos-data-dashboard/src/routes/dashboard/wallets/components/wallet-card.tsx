import { Button, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { XIcon } from "lucide-react";

type WalletCardProps = {
  address: string;
  onDelete: (address: string) => void;
};

export const WalletCard = ({ address, onDelete }: WalletCardProps) => {
  return (
    <HStack align="center" justify="space-between" gap={5} p={5} bg="neutral.900" rounded="xl">
      <HStack gap={5}>
        <Image src="/idos-dashboard-logo-dark.svg" alt="Wallet image" w={50} h={50} />
        <VStack align="stretch" gap={0} overflow="hidden">
          <Text color="neutral.600">Address</Text>
          <Text isTruncated maxW={200}>
            {address}
          </Text>
        </VStack>
      </HStack>
      <Button
        id={`delete-wallet-${address}`}
        leftIcon={<XIcon size={20} />}
        onClick={() => onDelete(address)}
      >
        Delete
      </Button>
    </HStack>
  );
};
