import {
  BoxProps,
  HStack,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from "@chakra-ui/react";

import { useState } from "react";
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

export const AddWallet = (props: AddWalletProps) => {
  const [mode, setMode] = useState<AddWalletMode | undefined>();
  console.log(mode);

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
        <ModalHeader mt={2}>
          <Heading fontSize="2xl" fontWeight="medium" textAlign="center">
            Add New Wallet
          </Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody mb={4}>
          <HStack gap={3}>
            <AddWalletButton
              onClick={() => {
                setMode("manual");
              }}
            >
              <Image alt="Insert wallet address" src={WalletAddress} />
              <Text as="span" color="neutral.500">
                Insert wallet <br />
                address
              </Text>
            </AddWalletButton>
            <AddWalletButton
              onClick={() => {
                setMode("wallet-selector");
              }}
            >
              <Image
                w={120}
                h={108}
                alt="Select and connect a wallet"
                src={WalletsGrid}
              />
              <Text as="span" color="neutral.500">
                Select and connect a wallet
              </Text>
            </AddWalletButton>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
