import {
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
  Th,
  Thead,
  Tr,
  useBreakpointValue,
} from "@chakra-ui/react";

import type { idOSGrant } from "@idos-network/core";
import { Button } from "@/components/ui/button";
import { timelockToMs } from "../../utils/time";
import { useFetchGrants, useRevokeGrant } from "../shared";

type GrantsCenterProps = {
  credentialId: string;
  isOpen: boolean;
  onClose: () => void;
};

function generateGrantId(grant: idOSGrant): string {
  const { data_id, ag_grantee_wallet_identifier, locked_until } = grant;
  return [data_id, ag_grantee_wallet_identifier, locked_until].join("-");
}

function timelockToDate(timelock: number): string {
  const milliseconds = timelockToMs(timelock);

  return new Intl.DateTimeFormat(["ban", "id"], {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(milliseconds));
}

const Shares = ({ credentialId, grants }: { credentialId: string; grants: idOSGrant[] }) => {
  const revokeGrant = useRevokeGrant(credentialId);

  if (grants.length === 0) {
    return (
      <span className="block" id="no-grants">
        You have not shared this credential with anyone.
      </span>
    );
  }

  const onRevoke = (grant: idOSGrant) => {
    revokeGrant.mutate(grant);
  };

  return (
    <div className="flex flex-col items-stretch gap-8">
      <div className="flex flex-col gap-2">
        <span className="block">Credentials Grants Access Center</span>
        <span className="block text-neutral-500">
          This is where you can manage your credentials grants. You can choose which access is
          revoked or granted.
        </span>
      </div>
      <TableContainer rounded="lg" bg="neutral.800" border="1px solid" borderColor="neutral.700">
        <Table id={`grants-for-${credentialId}`} variant="simple" w="100%">
          <Thead>
            <Tr>
              <Th color="neutral.500">Consumer</Th>
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
                  <span className="block truncate">{grant.ag_grantee_wallet_identifier}</span>
                </Td>
                <Td>
                  <span className="block">
                    {+grant.locked_until ? timelockToDate(+grant.locked_until) : "No timelock"}
                  </span>
                </Td>
                <Td isNumeric>
                  <Button
                    id={`revoke-grant-${generateGrantId(grant)}`}
                    size="sm"
                    variant="destructiveOutline"
                    disabled={timelockToMs(+grant.locked_until) >= Date.now()}
                    isLoading={
                      revokeGrant.isPending && revokeGrant.variables?.data_id === grant.data_id
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
    </div>
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
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : null}
          {grants.isError ? (
            <span role="alert" className="block text-red-500">
              Something went wrong, please retry.
            </span>
          ) : null}
          {grants.isSuccess ? <Shares credentialId={credentialId} grants={grants.data} /> : false}
        </ModalBody>
        <ModalFooter gap={2.5}>
          {grants.isError ? (
            <Button variant="secondary" size="lg" onClick={() => grants.refetch()}>
              Retry
            </Button>
          ) : (
            false
          )}
          <Button variant="secondary" size="lg" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
