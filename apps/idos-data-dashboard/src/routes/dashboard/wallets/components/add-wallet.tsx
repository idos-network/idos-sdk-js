import {
  Button,
  Code,
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
  useBreakpointValue
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
          onClose();
          queryClient.invalidateQueries({
            queryKey: ["wallets"]
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
      onClose={onClose}
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
            {addWallet.isError ? (
              <Code w="100%" mb={4} px={2} py={1} color="red.500" rounded="lg">
                An unexpected error ocurred. Please try again.
              </Code>
            ) : (
              false
            )}

            <FormControl>
              <FormLabel fontSize="sm" htmlFor="address">
                Wallet address
              </FormLabel>
              <Input id="address" name="address" placeholder="Enter address" required={true} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" type="submit" isLoading={addWallet.isPending}>
              {addWallet.isError ? "Retry" : "Add wallet"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
