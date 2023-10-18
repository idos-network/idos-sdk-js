import { Loading } from "@/lib/components/loading.tsx";
import { Grant } from "@/lib/types";
import { useRevokeCredentialShare } from "@/routes/dashboard/credentials/mutations";
import {
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useFetchCredentialShares } from "../queries";
import { Credential } from "../types";

type SharesEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  credential?: Credential;
};

export function SharesEditor(props: SharesEditorProps) {
  const { t } = useTranslation();
  const grants = useFetchCredentialShares({
    variables: {
      owner: "thefuck.testnet",
      dataId: props.credential?.id as string,
    },
    enabled: !!props.credential,
  });
  const revokeCredentialShare = useRevokeCredentialShare();
  const toast = useToast();

  const credentialGrants = grants.data?.filter((grant) => props.credential?.shares?.includes(grant.dataId));
  const onRevokeGrant = (grant: Grant) => {
    revokeCredentialShare.mutate(
      {
        recordId: props.credential?.id as string,
        grantee: grant.grantee,
        dataId: grant.dataId,
      },
      {
        onSuccess() {
          toast({
            title: t("credential-successfully-revoked"),
          });
          props.onClose();
        },
      }
    );
  };

  const { credential } = props;

  return (
    <Drawer isOpen={props.isOpen} onClose={props.onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          {t("credential-shares", { type: credential?.credential_type, issuer: credential?.issuer })}
        </DrawerHeader>

        <DrawerBody>
          {grants.isLoading ? (
            <Center p={10}>
              <Loading />
            </Center>
          ) : grants.isError ? (
            <Center p={10}>
              <Text color="red">{t("unexpected-error-ocurred")}</Text>
            </Center>
          ) : grants.isFetched ? (
            <>
              <TableContainer border="1px solid" borderColor="gray.200" rounded="md">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>{t("address")}</Th>
                      <Th isNumeric>{t("actions")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {credentialGrants?.map((grant) => (
                      <Tr key={grant.dataId}>
                        <Td fontWeight="semibold">{grant.grantee}</Td>
                        <Td isNumeric>
                          <Button colorScheme="orange" onClick={() => onRevokeGrant(grant)} size="xs" variant="outline">
                            {t("revoke")}
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
