import { useAddWallet } from "#/routes/dashboard/wallets/mutations";
import { useFetchWallets } from "#/routes/dashboard/wallets/queries";
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { FormEvent } from "react";

type AddWalletProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ManualModeProps = {
  onSubmit: (address: string) => void;
  onClose: () => void;
  isPending: boolean;
};

const ManualMode = (props: ManualModeProps) => {
  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const data = new FormData(form);
    props.onSubmit(data.get("address") as string);
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalHeader mt={2}>
        <Heading fontSize="2xl" fontWeight="medium" textAlign="center">
          Insert Wallet Address
        </Heading>
      </ModalHeader>
      <ModalCloseButton onClick={props.onClose} />
      <ModalBody>
        <FormControl>
          <FormLabel fontSize="sm" htmlFor="address">
            WALLET ADDRESS
          </FormLabel>
          <Input
            id="address"
            name="address"
            placeholder="Enter address"
            required={true}
          />
        </FormControl>
      </ModalBody>
      <ModalFooter justifyContent="center">
        <Button
          colorScheme="green"
          isLoading={props.isPending}
          size="lg"
          type="submit"
          variant="solid"
        >
          Add Wallet
        </Button>
      </ModalFooter>
    </form>
  );
};

export const AddWallet = (props: AddWalletProps) => {
  const addWallet = useAddWallet();
  const queryClient = useQueryClient();

  const onSubmit = (address: string) => {
    addWallet.mutate(
      { address },
      {
        onSuccess() {
          queryClient.invalidateQueries({
            queryKey: useFetchWallets.getKey()
          });
          onClose();
        }
      }
    );
  };

  const onClose = () => {
    props.onClose();
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size={{
        base: "full",
        md: "lg"
      }}
    >
      <ModalOverlay />
      <ModalContent gap={5}>
        <ManualMode
          onSubmit={onSubmit}
          onClose={onClose}
          isPending={addWallet.isPending}
        />
      </ModalContent>
    </Modal>
  );
};
