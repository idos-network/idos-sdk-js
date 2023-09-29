import { AbsoluteCenter, Flex, Spinner, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export function Loading() {
  const { t } = useTranslation();

  return (
    <AbsoluteCenter>
      <Flex align="center" gap={2}>
        <Text fontWeight="semibold">{t("please-wait")}</Text>
        <Spinner size="sm" />
      </Flex>
    </AbsoluteCenter>
  );
}
