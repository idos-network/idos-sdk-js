import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";

type AddWalletCardProps = {
  onAddWallet: () => void;
};

export const AddWalletCard = (props: AddWalletCardProps) => {
  return (
    <Stack gap={8} p={7} bg="neutral.900" rounded="xl">
      <Heading fontSize="2xl" fontWeight="medium">
        You have 0 wallets added.
      </Heading>
      <Text color="neutral.600" fontSize="2xl">
        Add your first wallet and store it on the idOS.
      </Text>
      <Box>
        <Button
          colorScheme="green"
          leftIcon={<PlusIcon size={24} />}
          onClick={props.onAddWallet}
          size="xl"
        >
          Add wallet
        </Button>
      </Box>
    </Stack>
  );
};
