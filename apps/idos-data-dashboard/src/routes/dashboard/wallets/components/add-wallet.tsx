import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
  useToast
} from "@chakra-ui/react";
import { DefaultError, useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent } from "react";

import { useIdOS } from "@/core/idos";

type AddWalletProps = {
  isOpen: boolean;
  onClose: () => void;
};

const useAddWalletMutation = () => {
  const { sdk } = useIdOS();

  return useMutation<{ address: string }, DefaultError, { address: string }>({
    mutationFn: ({ address }) => sdk.data.create("wallets", { address, signature: "", message: "" })
  });
};

export const AddWallet = ({ isOpen, onClose }: AddWalletProps) => {
  const toast = useToast();

  const isCentered = useBreakpointValue(
    {
      base: false,
      md: true
    },
    {
      fallback: "base"
    }
  );

  const queryClient = useQueryClient();

  const addWallet = useAddWalletMutation();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const address = new FormData(form).get("address") as string;

    addWallet.mutate(
      { address },
      {
        async onSuccess() {
          form.reset();
          handleClose();
          queryClient.invalidateQueries({
            queryKey: ["wallets"]
          });
        },
        async onError() {
          toast({
            title: "Error while adding wallet",
            description: "An unexpected error. Please try again.",
            position: "bottom-right",
            status: "error"
          });
        }
      }
    );
  };

  const handleClose = () => {
    addWallet.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={{
        base: "full",
        lg: "xl"
      }}
      isCentered={isCentered}
    >
      <ModalOverlay />
      <ModalContent bg="neutral.900" rounded="xl">
        <form onSubmit={handleSubmit}>
          <ModalHeader>Insert wallet address</ModalHeader>
          <ModalCloseButton onClick={handleClose} />
          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm" htmlFor="address">
                Wallet address
              </FormLabel>
              <Input id="address" name="address" placeholder="Enter address" required={true} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" type="submit" isLoading={addWallet.isPending}>
              {addWallet.isError ? "Try again" : "Add wallet"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
