import { Button, HStack, Image, Stack, Text, Tooltip, VStack } from "@chakra-ui/react";
import { XIcon } from "lucide-react";

type WalletCardProps = {
  address: string;
  isDisabled?: boolean;
  onDelete: (address: string) => void;
};

export const WalletCard = ({ address, isDisabled, onDelete }: WalletCardProps) => {
  return (
    <Stack
      align="stretch"
      justify="space-between"
      gap={5}
      p={5}
      bg="neutral.900"
      rounded="xl"
      flexDir={{ base: "column", lg: "row" }}
    >
      <HStack gap={5}>
        <Image src="/idos-dashboard-logo-dark.svg" alt="Wallet image" w={50} h={50} />
        <VStack align="stretch" gap={0} overflow="hidden">
          <Text color="neutral.600">Address</Text>
          <Text isTruncated maxW={200}>
            {address}
          </Text>
        </VStack>
      </HStack>
      <Tooltip
        hasArrow
        bg="neutral.500"
        px={2}
        py={0.5}
        rounded="md"
        isDisabled={!isDisabled}
        label="Please connect another wallet to delete this one"
        placement="auto"
      >
        <Button
          isDisabled={isDisabled}
          id={`delete-wallet-${address}`}
          leftIcon={<XIcon size={20} />}
          onClick={() => onDelete(address)}
        >
          Delete
        </Button>
      </Tooltip>
    </Stack>
  );
};
