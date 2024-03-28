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
import { getNearFullAccessPublicKey } from "@idos-network/idos-sdk";

type AddWalletProps = {
  isOpen: boolean;
  onClose: () => void;
};

const useAddWalletMutation = () => {
  const { sdk } = useIdOS();

  return useMutation<{ address: string }, DefaultError, { address: string; public_key: string }>({
    mutationFn: ({ address, public_key }) => sdk.data.create("wallets", { address, public_key, signature: "", message: "" })
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const address = new FormData(form).get("address") as string;
    const address_regexp = /^0x[0-9a-fA-F]{40}$/;
    const address_type = address_regexp.test(address) ? "EVM" : "NEAR"
    var public_key: string;
    if (address_type == "NEAR") {
      public_key = await getNearFullAccessPublicKey(address);
      if (!public_key) {
        toast({
          title: "Error while adding wallet",
          description: "This is not correct ENV or NEAR wallet",
          position: "bottom-right",
          status: "error"
        });
        return;
      }
    } else {
      public_key = ""
    }

    addWallet.mutate(
      { address, public_key },
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
