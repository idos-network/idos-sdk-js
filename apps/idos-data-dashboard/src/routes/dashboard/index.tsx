import { Box, Divider, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";

import { LinkProps, NavLink } from "@/lib/components/link";

function DashboardLink(props: LinkProps) {
  return (
    <NavLink
      py={1.5}
      borderBottom="1px solid transparent"
      _hover={{
        textDecoration: "none",
        color: "green.300"
      }}
      _activeLink={{
        color: "green.500",
        borderBottomColor: "green.500"
      }}
      {...props}
    />
  );
}

export function Component() {
  const { t } = useTranslation();

  return (
    <Box>
      <Flex align="center" gap={6}>
        <DashboardLink to="/">{t("attributes")}</DashboardLink>
        <DashboardLink to="/wallets">{t("wallets")}</DashboardLink>
        <DashboardLink to="/credentials">{t("credentials")}</DashboardLink>
      </Flex>
      <Divider mb={5} borderColor="gray.200" />
      <Outlet />
    </Box>
  );
}
