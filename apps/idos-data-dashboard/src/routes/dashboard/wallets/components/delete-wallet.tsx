import { WalletIcon } from "#/lib/components/icons/wallet";
import {
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteWallet } from "../mutations";
import { Wallet, useFetchWallets } from "../queries";

type DeleteCredentialProps = {
  isOpen: boolean;
  wallet: Wallet;
  onClose: () => void;
};
export const DeleteWallet = (props: DeleteCredentialProps) => {
  const deleteWallet = useDeleteWallet();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    await deleteWallet.mutateAsync({ id: props.wallet.id });
    queryClient.invalidateQueries({
      queryKey: useFetchWallets.getKey()
    });
    props.onClose();
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size={{
        base: "full",
        md: "md"
      }}
    >
      <ModalOverlay />
      <ModalContent gap={5}>
        <ModalHeader mt={2}>
          <Heading fontSize="2xl" fontWeight="medium" textAlign="center">
            Delete Wallet
          </Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap={10}>
            <Text>Do you want to delete this wallet from the idOS?</Text>
            <Flex
              align="center"
              gap={14}
              p={8}
              bg="neutral.800"
              border="1px solid"
              borderColor="neutral.600"
              rounded="xl"
            >
              <Box>
                <WalletIcon w={46} h={27} stroke="#00ffb9" fill="transparent" />
              </Box>
              <VStack align="start" gap={2}>
                <Heading color="neutral.600" fontWeight="medium" size="sm">
                  Address
                </Heading>
                <Text>{props.wallet.address}</Text>
              </VStack>
            </Flex>
          </Flex>
        </ModalBody>
        <ModalFooter
          alignItems="center"
          justifyContent="space-between"
          gap={10}
        >
          <Button onClick={props.onClose} variant="outline">
            Cancel
          </Button>

          <Button
            colorScheme="green"
            isLoading={deleteWallet.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
