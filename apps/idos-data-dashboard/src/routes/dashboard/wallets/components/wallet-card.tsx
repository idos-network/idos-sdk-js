import { Button, HStack, Text, VStack } from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { Wallet } from "../queries";

type WalletCardProps = {
  wallet: Wallet;
  onDeleteWallet: (wallet: Wallet) => void;
};
export const WalletCard = (props: WalletCardProps) => {
  return (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      gap={14}
      gap={5}
      px={7}
      py={5}
      bg="neutral.900"
      border="1px solid"
      borderColor="neutral.800"
      rounded="xl"
    >
      <VStack alignItems="start">
        <Text color="neutral.600" fontSize="sm">
          Address
        </Text>
        <Text>{props.wallet.address}</Text>
      </VStack>
      <Button leftIcon={<XIcon size={24} />} onClick={() => props.onDeleteWallet(props.wallet)} variant="ghost">
        Delete
      </Button>
    </HStack>
  );
};
