import {
  BoxProps,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Image,
  Input,
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
import { FormEvent, useState } from "react";
import { useAddWallet } from "#/routes/dashboard/wallets/mutations";
import { useFetchWallets } from "#/routes/dashboard/wallets/queries";
import WalletAddress from "../assets/wallet-address.svg";
import WalletsGrid from "../assets/wallets-grid.svg";

type AddWalletProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AddWalletButton = (props: BoxProps) => {
  return (
    <VStack
      as="button"
      alignContent="stretch"
      justify="space-between"
      direction="column"
      gap={5}
      w="50%"
      h={60}
      px={5}
      py={8}
      bg="neutral.800"
      border="1px solid"
      borderColor="neutral.600"
      _hover={{
        bg: "neutral.600"
      }}
      rounded="2xl"
      {...props}
    />
  );
};

type AddWalletMode = "manual" | "wallet-selector";

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
          <Input id="address" name="address" placeholder="Enter address" required={true} />
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
  const [mode, setMode] = useState<AddWalletMode | undefined>("manual");
  const addWallet = useAddWallet();
  const queryClient = useQueryClient();

  const onSubmit = (address: string) => {
    console.log(address);
    addWallet.mutate(
      { address },
      {
        onSuccess() {
          setMode(undefined);
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
        {mode === "manual" ? (
          <ManualMode onSubmit={onSubmit} onClose={onClose} isPending={addWallet.isPending} />
        ) : (
          <>
            <ModalHeader mt={2}>
              <Heading fontSize="2xl" fontWeight="medium" textAlign="center">
                Add New Wallet
              </Heading>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody mb={4}>
              <HStack gap={3}>
                <AddWalletButton onClick={() => setMode("manual")}>
                  <Image alt="Insert wallet address" src={WalletAddress} />
                  <Text as="span" color="neutral.500">
                    Insert wallet <br />
                    address
                  </Text>
                </AddWalletButton>
                <AddWalletButton onClick={() => setMode("wallet-selector")}>
                  <Image w={120} h={108} alt="Select and connect a wallet" src={WalletsGrid} />
                  <Text as="span" color="neutral.500">
                    Select and connect a wallet
                  </Text>
                </AddWalletButton>
              </HStack>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
