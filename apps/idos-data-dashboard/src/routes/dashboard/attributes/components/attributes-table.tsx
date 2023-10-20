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
  Tr
} from "@chakra-ui/react";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Attribute } from "../types";

type AttributesTableProps = {
  isLoading: boolean;
  attributes: Attribute[] | undefined;
  onAttributeEdit: (value: Attribute) => void;
  onAttributeRemove: (value: Attribute) => void;
  onAttributeShare?: (value: Attribute) => void;
  onViewAttributeShares?: (value: Attribute) => void;
};

export function AttributesTable(props: AttributesTableProps) {
  const { t } = useTranslation();

  return (
    <TableContainer
      overflowX="auto"
      border="1px solid"
      borderColor="gray.200"
      rounded="md"
    >
      {props.isLoading ? (
        <Center gap={2} h={28}>
          <Text fontWeight="semibold">{t("loading-attributes")}</Text>
          <Spinner size="sm" />
        </Center>
      ) : (
        <Table minH={28} layout="fixed">
          <Thead>
            <Tr>
              <Th isTruncated>{t("attribute-name")}</Th>
              <Th isTruncated>{t("attribute-value")}</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {props.attributes?.length === 0 ? (
              <Tr>
                <Td fontSize="sm" fontWeight="semibold" colSpan={3} isTruncated>
                  {t("no-data")}
                </Td>
              </Tr>
            ) : (
              props.attributes?.map((attr) => (
                <Tr key={attr.id}>
                  <Td fontWeight="semibold" isTruncated>
                    {attr.attribute_key}
                  </Td>
                  <Td fontWeight="semibold" isTruncated>
                    {attr.value}
                  </Td>
                  <Td isNumeric>
                    <Flex align="center" justify="end" gap={2}>
                      {attr.shares && attr.shares.length > 0 ? (
                        <Button
                          colorScheme="orange"
                          onClick={() => props.onViewAttributeShares?.(attr)}
                          size="sm"
                          variant="outline"
                        >
                          {t("shared-with-count", {
                            count: attr.shares.length
                          })}
                        </Button>
                      ) : null}
                      {/* <IconButton
                        aria-label={t("share-attribute")}
                        onClick={() => props.onAttributeShare?.(attr)}
                        size="sm"
                        variant="outline"
                      >
                        <ShareIcon width={16} height={16} />
                      </IconButton> */}

                      <IconButton
                        aria-label={t("edit-attribute")}
                        onClick={() => props.onAttributeEdit(attr)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit2Icon width={16} height={16} />
                      </IconButton>
                      <IconButton
                        aria-label={t("remove-attribute")}
                        colorScheme="orange"
                        onClick={() => props.onAttributeRemove(attr)}
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
