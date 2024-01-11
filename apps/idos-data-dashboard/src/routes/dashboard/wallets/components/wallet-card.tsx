import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  HStack,
  Image,
  Text,
  VStack,
  useDisclosure,
  useToast
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
  const toast = useToast();
  const queryClient = useQueryClient();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const deleteWallet = useDeleteWalletMutation();

  const handleClose = () => {
    deleteWallet.reset();
    onClose();
  };

  const handleDeleteWallet = (id: string) => {
    deleteWallet.mutate(
      { id },
      {
        async onSuccess() {
          handleClose();
          queryClient.invalidateQueries({
            queryKey: ["wallets"]
          });
        },
        async onError() {
          toast({
            title: "Error while deleting wallet",
            description: "An unexpected error. Please try again.",
            position: "bottom-right",
            status: "error"
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
      onClose={handleClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent bg="neutral.900" rounded="xl">
          <AlertDialogHeader>Delete wallet</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>Do you want to delete this wallet from the idOS?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={handleClose}>
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
