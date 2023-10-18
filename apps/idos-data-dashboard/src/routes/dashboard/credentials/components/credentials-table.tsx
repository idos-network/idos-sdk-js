import {
  Button,
  Center,
  Flex,
  IconButton,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { Edit2Icon, EyeIcon, ShareIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Credential } from "../types";

type CredentialsTableProps = {
  isLoading?: boolean;
  credentials?: Credential[];
  onCredentialView?: (value: Credential) => void;
  onCredentialEdit?: (value: Credential) => void;
  onCredentialRemove?: (value: Credential) => void;
  onCredentialShare?: (value: Credential) => void;
  onViewCredentialShares?: (value: Credential) => void;
};
export function CredentialsTable(props: CredentialsTableProps) {
  const { t } = useTranslation();

  return (
    <TableContainer border="1px solid" borderColor="gray.200" rounded="md">
      {props.isLoading ? (
        <Center gap={2} h={28}>
          <Text fontWeight="semibold">{t("loading-credentials")}</Text>
          <Spinner size="sm" />
        </Center>
      ) : (
        <Table minH={28}>
          <Thead>
            <Tr>
              <Th>{t("credential-type")}</Th>
              <Th>{t("credential-issuer")}</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {props.credentials?.length === 0 ? (
              <Tr>
                <Td fontSize="sm" fontWeight="semibold" colSpan={2} isTruncated>
                  {t("no-data")}
                </Td>
              </Tr>
            ) : (
              props.credentials?.map((credential) => (
                <Tr key={credential.id}>
                  <Td fontWeight="semibold" isTruncated>
                    {credential.credential_type}
                  </Td>
                  <Td fontWeight="semibold" isTruncated>
                    {credential.issuer}
                  </Td>

                  <Td isNumeric>
                    <Flex align="center" justify="end" gap={2}>
                      {credential.shares && credential.shares.length > 0 ? (
                        <Button
                          colorScheme="orange"
                          onClick={() => props.onViewCredentialShares?.(credential)}
                          size="sm"
                          variant="outline"
                        >
                          {t("shared-with-count", { count: credential.shares.length })}
                        </Button>
                      ) : null}

                      <IconButton
                        aria-label={t("share-credential")}
                        onClick={() => props.onCredentialShare?.(credential)}
                        size="sm"
                        variant="outline"
                      >
                        <ShareIcon width={16} height={16} />
                      </IconButton>
                      <IconButton
                        aria-label={t("view-credential")}
                        onClick={() => props.onCredentialView?.(credential)}
                        size="sm"
                        variant="outline"
                      >
                        <EyeIcon width={16} height={16} />
                      </IconButton>
                      <IconButton
                        aria-label={t("edit-credential")}
                        onClick={() => props.onCredentialEdit?.(credential)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit2Icon width={16} height={16} />
                      </IconButton>
                      <IconButton
                        aria-label={t("remove-credential")}
                        colorScheme="orange"
                        onClick={() => props.onCredentialRemove?.(credential)}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2Icon width={16} height={16} />
                      </IconButton>
                    </Flex>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      )}
    </TableContainer>
  );
}
