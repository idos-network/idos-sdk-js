import { useIdOS } from "@/core/idos";
import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { ArrowUpRightIcon } from "lucide-react";

type ProfOfPersonhoodProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ETH_PROOF_LINK =
  "https://app.fractal.id/authorize?client_id=er6XdOOyU_2y8MfKM5pN_fG52l3dVQYIPXBm6Lf4UVc&redirect_uri=https%3A%2F%2Fdashboard.idos.network%2Fsuccess&response_type=code&scope=contact%3Aread%20verification.uniqueness%3Aread%20verification.uniqueness.details%3Aread%20verification.wallet-eth%3Aread%20verification.wallet-eth.details%3Aread%20verification.idos%3Aread%20verification.idos.details%3Aread";

const NEAR_PROOF_LINK =
  "https://app.fractal.id/authorize?client_id=er6XdOOyU_2y8MfKM5pN_fG52l3dVQYIPXBm6Lf4UVc&redirect_uri=https%3A%2F%2Fdashboard.idos.network%2Fsuccess&response_type=code&scope=contact%3Aread%20verification.uniqueness%3Aread%20verification.uniqueness.details%3Aread%20verification.wallet-near%3Aread%20verification.wallet-near.details%3Aread%20verification.idos%3Aread%20verification.idos.details%3Aread";

export const ProfOfPersonhood = ({ isOpen, onClose }: ProfOfPersonhoodProps) => {
  const isCentered = useBreakpointValue(
    {
      base: false,
      md: true,
    },
    {
      fallback: "base",
    },
  );

  const { address } = useIdOS();
  const PROOF_LINK = address?.startsWith("0x") ? ETH_PROOF_LINK : NEAR_PROOF_LINK;

  return (
    <Modal
      isOpen={isOpen}
      size={{
        base: "full",
        lg: "2xl",
      }}
      isCentered={isCentered}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent bg="neutral.900" rounded="xl">
        <ModalHeader textAlign="center">Add Proof of Personhood</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid
            columns={{
              base: 1,
              lg: 3,
            }}
            spacing={5}
          >
            <VStack
              justifyContent="space-between"
              p={5}
              bg="neutral.800"
              border="1px solid"
              borderColor="neutral.700"
              rounded="lg"
            >
              <Image
                src="/flow-1-icon.svg"
                alt="Prove that you are a unique human being"
                w="auto"
                h="90px"
              />
              <Text color="neutral.500">Prove that you are a unique human being</Text>
            </VStack>
            <VStack
              justifyContent="center"
              p={5}
              bg="neutral.800"
              border="1px solid"
              borderColor="neutral.700"
              rounded="lg"
            >
              <Image src="/flow-2-icon.svg" alt="It only takes 1 minute!" w="auto" h="90px" />
              <Text color="neutral.500">It only takes 1 minute!</Text>
            </VStack>
            <VStack
              justifyContent="space-between"
              placeContent="center"
              p={5}
              bg="neutral.800"
              border="1px solid"
              borderColor="neutral.700"
              rounded="lg"
            >
              <Image src="/flow-3-icon.svg" alt="Prove it with Fractal ID" w="auto" h="90px" />
              <Text color="neutral.500">Prove it with Fractal ID</Text>
            </VStack>
          </SimpleGrid>
        </ModalBody>
        <ModalFooter placeContent="center">
          <Button
            rightIcon={<ArrowUpRightIcon size={24} />}
            flex={{
              base: 1,
              lg: "none",
            }}
            onClick={() => window.location.assign(PROOF_LINK)}
          >
            Verify with Fractal ID
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
