import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Code,
  HStack,
  Image,
  Text,
  VStack,
  useDisclosure
} from "@chakra-ui/react";
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useRef } from "react";

import { useIdOS } from "@/core/idos";
import { idOSWallet } from "../types";

type WalletCardProps = {
  wallet: idOSWallet;
};

type DeleteWalletProps = {
  isOpen: boolean;
  wallet: idOSWallet;
  onClose: () => void;
};

const useDeleteWalletMutation = () => {
  const { sdk } = useIdOS();
  return useMutation<{ id: string }, DefaultError, { id: string }>({
    mutationFn: ({ id }) => sdk.data.delete("wallets", id)
  });
};

const DeleteWallet = ({ isOpen, wallet, onClose }: DeleteWalletProps) => {
  const queryClient = useQueryClient();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteWallet = useDeleteWalletMutation();

  const handleDeleteWallet = (id: string) => {
    deleteWallet.mutate(
      { id },
      {
        async onSuccess() {
          onClose();
          queryClient.invalidateQueries({
            queryKey: ["wallets"]
          });
        }
      }
    );
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      size={{
        base: "full",
        lg: "lg"
      }}
      isCentered
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent bg="neutral.900" rounded="xl">
          <AlertDialogHeader>Delete wallet</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            {deleteWallet.isError ? (
              <Code w="100%" mb={4} px={2} py={1} color="red.500" rounded="lg">
                An unexpected error ocurred. Please try again.
              </Code>
            ) : (
              false
            )}
            Do you want to delete this wallet from the idOS?
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              onClick={() => handleDeleteWallet(wallet.id)}
              isLoading={deleteWallet.isPending}
            >
              {deleteWallet.isError ? "Retry" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export const WalletCard = ({ wallet }: WalletCardProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

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
      <Button leftIcon={<XIcon size={20} />} onClick={onOpen}>
        Delete
      </Button>
      <DeleteWallet isOpen={isOpen} wallet={wallet} onClose={onClose} />
    </HStack>
  );
};
