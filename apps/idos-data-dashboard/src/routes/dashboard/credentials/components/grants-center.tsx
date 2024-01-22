import { useIdOS } from "@/core/idos";
import {
  Box,
  Button,
  Center,
  Code,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useBreakpointValue
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { idOSCredential, idOSGrant } from "../types";

type GrantsCenterProps = {
  credentialId: string;
  isOpen: boolean;
  onClose: () => void;
};

const useFetchGrants = ({ credentialId }: { credentialId: string }) => {
  const { sdk, address } = useIdOS();
  const queryClient = useQueryClient();
  const credentials = queryClient.getQueryData<idOSCredential[]>(["credentials"]);

  return useQuery({
    queryKey: ["grants", credentialId],
    queryFn: () => sdk.grants.list({ owner: address }),
    select(grants) {
      if (!credentials || !grants) return [];

      const _credentials = credentials
        .filter((credential) => credential.original_id === credentialId)
        .map((credential) => credential.id);

      return grants.filter((grant) => _credentials.includes(grant.dataId));
    }
  });
};

const useRevokeGrant = () => {
  const { sdk } = useIdOS();

  return useMutation({
    mutationFn: ({ grantee, dataId, lockedUntil }: idOSGrant) =>
      sdk.grants.revoke("credentials", dataId, grantee, dataId, lockedUntil)
  });
};

const Shares = ({ grants }: { credentialId: string; grants: idOSGrant[] }) => {
  const revokeGrant = useRevokeGrant();
  const queryClient = useQueryClient();

  if (grants.length === 0) {
    return <Text>You have not shared this credential with anyone.</Text>;
  }

  const onRevoke = (grant: idOSGrant) => {
    revokeGrant.mutate(grant, {
      onSuccess() {
        queryClient.invalidateQueries({
          queryKey: ["grants"]
        });
      }
    });
  };

  return (
    <VStack align="stretch" gap={10}>
      <Box>
        <Text>Credentials Grants Access Center</Text>
        <Text color="neutral.500">
          This is where you can manage your credentials grants. You can choose which access is
          revoked or granted.
        </Text>
      </Box>
      <TableContainer rounded="lg" bg="neutral.800" border="1px solid" borderColor="neutral.700">
        <Table variant="simple" w="100%">
          <Thead>
            <Tr>
              <Th color="neutral.500">Grantee</Th>
              <Th color="neutral.500">Locked until</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {grants.map((grant) => (
              <Tr key={grant.dataId}>
                <Td maxW={140}>
                  <Text isTruncated>{grant.grantee}</Text>
                </Td>
                <Td>
                  <Text>{grant.lockedUntil ? grant.lockedUntil : "-"}</Text>
                </Td>
                <Td isNumeric>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    isLoading={
                      revokeGrant.isPending && revokeGrant.variables?.dataId === grant.dataId
                    }
                    onClick={() => onRevoke(grant)}
                  >
                    Revoke
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  );
};

export const GrantsCenter = ({ credentialId, isOpen, onClose }: GrantsCenterProps) => {
  const isCentered = useBreakpointValue(
    {
      base: false,
      md: true
    },
    {
      fallback: "base"
    }
  );

  const grants = useFetchGrants({ credentialId });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{
        base: "full",
        lg: "2xl"
      }}
      isCentered={isCentered}
    >
      <ModalOverlay />
      <ModalContent bg="neutral.900" rounded="xl">
        <ModalHeader>Grants center</ModalHeader>
        <ModalCloseButton onClick={onClose} />
        <ModalBody display="flex" alignItems="center">
          {grants.isLoading ? (
            <Center flex={1}>
              <Spinner />
            </Center>
          ) : (
            false
          )}
          {grants.isError ? (
            <Text color="red.500">Something went wrong, please retry.</Text>
          ) : (
            false
          )}
          {grants.isSuccess ? <Shares credentialId={credentialId} grants={grants.data} /> : false}
          <Code />
        </ModalBody>
        <ModalFooter gap={2.5}>
          {grants.isError ? <Button onClick={() => grants.refetch()}>Retry</Button> : false}
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
