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
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Loading } from "@/lib/components/loading.tsx";
import { useGrants, useRemoveGrant } from "@/lib/contract";
import { useRemoveCredential } from "../mutations";
import { useFetchCredentials } from "../queries";
import { Credential } from "../types";

type SharesEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  credential?: Credential;
};

// Use the following values for testing sharing functionality:
// Public key: uF098gFghgHkKPS4YsvKX5nK70/f4QIuYexCMtk+7yo=
// Address: 0xA986BD19FCfA5620AcAE34A3B8d0AF01B0169D30
export function SharesEditor(props: SharesEditorProps) {
  const { t } = useTranslation();
  const grants = useGrants();
  const revokeGrant = useRemoveGrant();
  const removeCredential = useRemoveCredential();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { credential } = props;

  const credentialGrants =
    grants.data?.filter((grant) => {
      const id = grant.at(2);
      if (!id) {
        return false;
      }
      return credential?.shares?.includes(id);
    }) ?? [];

  const onRevokeGrant = (grant: string[]) => {
    const address = grant.at(0);
    const grantee = grant.at(1);
    const id = grant.at(2);

    if (address !== undefined && grantee !== undefined && id !== undefined) {
      removeCredential.mutate(
        {
          id,
        },
        {
          onSuccess: () => {
            revokeGrant.mutate(
              { address: grantee, id, lockedUntil: 0 },
              {
                onSuccess() {
                  props.onClose();
                  toast({
                    title: t("grant-successfully-revoked"),
                  });
                  queryClient.invalidateQueries(useFetchCredentials.getKey());
                },
              }
            );
          },
          onError() {
            props.onClose();
            toast({
              title: t("error-while-revoking-grant"),
            });
          },
        }
      );
    }
  };

  const isMutating = removeCredential.isLoading || revokeGrant.isLoading;

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
                    {credentialGrants.map((grant) => (
                      <Tr key={grant.at(2)}>
                        <Td fontWeight="semibold">{grant.at(1)}</Td>
                        <Td isNumeric>
                          <Button
                            colorScheme="orange"
                            isLoading={isMutating}
                            onClick={() => onRevokeGrant(grant)}
                            size="xs"
                            variant="outline"
                          >
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
