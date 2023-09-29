import {
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
import { Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Wallet } from "../types";

type WalletsTableProps = {
  isLoading?: boolean;
  wallets?: Wallet[];
  onWalletRemove?: (value: Wallet) => void;
};
export function WalletsTable(props: WalletsTableProps) {
  const { t } = useTranslation();

  return (
    <TableContainer border="1px solid" borderColor="gray.200" rounded="md">
      {props.isLoading ? (
        <Center gap={2} h={28}>
          <Text fontWeight="semibold">{t("loading-wallets")}</Text>
          <Spinner size="sm" />
        </Center>
      ) : (
        <Table minH={28} layout="fixed">
          <Thead>
            <Tr>
              <Th>{t("wallet-address")}</Th>
              <Th>{t("wallet-signature")}</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {props.wallets?.length === 0 ? (
              <Tr>
                <Td fontSize="sm" fontWeight="semibold" colSpan={2} isTruncated>
                  {t("no-data")}
                </Td>
              </Tr>
            ) : (
              props.wallets?.map((wallet) => (
                <Tr key={wallet.id}>
                  <Td fontWeight="semibold" isTruncated>
                    {wallet.address}
                  </Td>
                  <Td fontWeight="semibold" isTruncated>
                    {wallet.signature}
                  </Td>
                  <Td isNumeric>
                    <Flex align="center" justify="end" gap={2}>
                      <IconButton
                        aria-label={t("remove-wallet")}
                        colorScheme="orange"
                        onClick={() => props.onWalletRemove?.(wallet)}
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
