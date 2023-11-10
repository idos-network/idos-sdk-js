import {
  Button,
  Flex,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Stack,
  Text
} from "@chakra-ui/react";
import { ArrowUpRightIcon } from "lucide-react";
import { PropsWithChildren } from "react";
import Flow1Icon from "./assets/flow-1-icon.svg";
import Flow2Icon from "./assets/flow-2-icon.svg";
import Flow3Icon from "./assets/flow-3-icon.svg";

const ProofBox = ({ children }: PropsWithChildren) => (
  <Flex
    align="center"
    justify="space-between"
    direction="column"
    gap={5}
    w={["auto", 200]}
    px={5}
    py={8}
    border="1px solid"
    borderColor="neutral.600"
    rounded="2xl"
  >
    {children}
  </Flex>
);

export const AddProofOfPersonhood = (props: Omit<ModalProps, "children">) => {
  return (
    <Modal isCentered isOpen={props.isOpen} onClose={props.onClose} size="2xl">
      <ModalOverlay />
      <ModalContent gap={6}>
        <ModalHeader mt={2}>
          <Heading fontSize="2xl" fontWeight="medium" textAlign="center">
            Add Proof of Personhood
          </Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack justifyContent="space-between" direction={["column", "row"]}>
            <ProofBox>
              <Image
                alt="Prove that you are a unique human being"
                src={Flow1Icon}
              />
              <Text color="neutral.500" fontSize="xl">
                Prove that you are a unique human being
              </Text>
            </ProofBox>
            <ProofBox>
              <Image alt="It only takes 1 minute!" src={Flow2Icon} />
              <Text color="neutral.500" fontSize="xl">
                It only takes 1 minute!
              </Text>
            </ProofBox>

            <ProofBox>
              <Image alt="Prove it with Fractal ID" src={Flow3Icon} />
              <Text color="neutral.500" fontSize="xl">
                Prove it with Fractal ID
              </Text>
            </ProofBox>
          </Stack>
        </ModalBody>
        <ModalFooter alignItems="center" justifyContent="center" mb={2}>
          <Button
            as="a"
            href="https://app.fractal.id/login?client_id=er6XdOOyU_2y8MfKM5pN_fG52l3dVQYIPXBm6Lf4UVc&redirect_uri=https%3A%2F%2Fdashboard.idos.network&response_type=code&scope=contact%3Aread%20verification.uniqueness%3Aread%20verification.uniqueness.details%3Aread%20verification.wallet-eth%3Aread%20verification.wallet-eth.details%3Aread%20verification.idos%3Aread%20verification.idos.details%3Aread"
            rightIcon={<ArrowUpRightIcon size={20} />}
            size="lg"
            variant="ghost"
          >
            Verify with Fractal ID
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
