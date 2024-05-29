import {
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
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";

import { useFetchGrants, useRevokeGrant } from "../shared";
import type { idOSGrant } from "../types";

type GrantsCenterProps = {
  credentialId: string;
  isOpen: boolean;
  onClose: () => void;
};

function generateGrantId(grant: idOSGrant): string {
  const { dataId, grantee, owner, lockedUntil } = grant;
  return [dataId, grantee, owner, lockedUntil].join("-");
}

function bigintToDate(bi: bigint): string {
  const milliseconds = Number(bi) * 1000;

  return new Intl.DateTimeFormat(["ban", "id"]).format(new Date(milliseconds));
}

const Shares = ({ credentialId, grants }: { credentialId: string; grants: idOSGrant[] }) => {
  const revokeGrant = useRevokeGrant();
  const queryClient = useQueryClient();

  if (grants.length === 0) {
    return <Text>You have not shared this credential with anyone.</Text>;
  }

  const onRevoke = (grant: idOSGrant) => {
    revokeGrant.mutate(grant, {
      onSuccess() {
        queryClient.invalidateQueries({
          queryKey: ["grants"],
        });
      },
    });
  };

  return (
    <VStack align="stretch" gap={8}>
      <Stack gap={2}>
        <Text>Credentials Grants Access Center</Text>
        <Text color="neutral.500">
          This is where you can manage your credentials grants. You can choose which access is
          revoked or granted.
        </Text>
      </Stack>
      <TableContainer rounded="lg" bg="neutral.800" border="1px solid" borderColor="neutral.700">
        <Table id={`grants-for-${credentialId}`} variant="simple" w="100%">
          <Thead>
            <Tr>
              <Th color="neutral.500">Grantee</Th>
              <Th color="neutral.500">Locked until</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {grants.map((grant) => (
              <Tr
                key={generateGrantId(grant)}
                id={`grant-${generateGrantId(grant)}`}
                data-grant={JSON.stringify(grant)}
              >
                <Td maxW={140}>
                  <Text isTruncated>{grant.grantee}</Text>
                </Td>
                <Td>
                  <Text>{grant.lockedUntil ? bigintToDate(BigInt(grant.lockedUntil)) : "-"}</Text>
                </Td>
                <Td isNumeric>
                  <Button
                    id={`revoke-grant-${generateGrantId(grant)}`}
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    isDisabled={Boolean(
                      grant.lockedUntil &&
                        BigInt(grant.lockedUntil) < BigInt(Math.floor(Date.now() / 1000)),
                    )}
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
      md: true,
    },
    {
      fallback: "base",
    },
  );

  const grants = useFetchGrants({ credentialId });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{
        base: "full",
        lg: "2xl",
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
          ) : null}
          {grants.isError ? <Text color="red.500">Something went wrong, please retry.</Text> : null}
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
