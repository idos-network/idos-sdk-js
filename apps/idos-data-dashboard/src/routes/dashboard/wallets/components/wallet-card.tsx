import Metamask from "#/assets/metamask.svg";
import Near from "#/assets/near.svg";
import { Button, Center, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { Wallet } from "../queries";
type WalletCardProps = {
  wallet: Wallet;
  onDeleteWallet: (wallet: Wallet) => void;
};
export const WalletCard = (props: WalletCardProps) => {
  const { wallet } = props;
  const isNear = wallet.address.includes("near");
  const imageSrc = isNear ? Near : Metamask;
  const imageAlt = isNear ? "Near" : "Metamask";

  return (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      gap={5}
      px={7}
      py={5}
      bg="neutral.900"
      border="1px solid"
      borderColor="neutral.800"
      rounded="xl"
    >
      <Center gap={8}>
        <Center w={12} h={12} bg="neutral.800" rounded="lg">
          <Image alt={imageAlt} src={imageSrc} />
        </Center>
        <VStack alignItems="start" gap={0}>
          <Text color="neutral.600" fontSize="sm">
            Address
          </Text>
          <Text w={240} isTruncated>
            {props.wallet.address}
          </Text>
        </VStack>
      </Center>
      <Button
        leftIcon={<XIcon size={24} />}
        onClick={() => props.onDeleteWallet(props.wallet)}
        variant="ghost"
      >
        Delete
      </Button>
    </HStack>
  );
};
