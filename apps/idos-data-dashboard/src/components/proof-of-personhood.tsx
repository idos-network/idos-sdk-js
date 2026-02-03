import {
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
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { ArrowUpRightIcon } from "lucide-react";
import { useIdOS } from "@/idOS.provider";
import { Button } from "./ui/button";

type ProfOfPersonhoodProps = {
  isOpen: boolean;
  onClose: () => void;
};

const fractalProofUrlBase = import.meta.env.VITE_FRACTAL_PROOF_URL_BASE ?? "app.fractal.id";
const fractalProofUrlClientId =
  import.meta.env.VITE_FRACTAL_PROOF_URL_CLIENT_ID ?? "er6XdOOyU_2y8MfKM5pN_fG52l3dVQYIPXBm6Lf4UVc";
const fractalProofUrlRedirectUri =
  import.meta.env.VITE_FRACTAL_PROOF_URL_REDIRECT_URI ?? "https://dashboard.idos.network/success";

const fractalProofUrl = (address: string) => {
  // cspell:disable
  return `https://${fractalProofUrlBase}/authorize?client_id=${fractalProofUrlClientId}&redirect_uri=${encodeURIComponent(
    fractalProofUrlRedirectUri,
  )}&response_type=code&scope=contact%3Aread%20verification.uniqueness%3Aread%20verification.uniqueness.details%3Aread%20verification.idos%3Aread%20verification.idos.details%3Aread&method=wallet&currency=${
    address?.startsWith("0x") ? "eth" : "near"
  }&ensure_wallet=${address}`;
  // cspell:enable
};

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

  const idOSClient = useIdOS();

  if (!idOSClient.walletIdentifier) return null;

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
            className="flex-1 lg:flex-none flex gap-1 items-center"
            variant="secondary"
            onClick={() => window.location.assign(fractalProofUrl(idOSClient.walletIdentifier))}
          >
            Verify with Fractal ID
            <ArrowUpRightIcon size={24} />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
