import { Box, Divider, Flex } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

import { LinkProps, NavLink } from "@/lib/components/link";
import { Loading } from "@/lib/components/loading";
import { IDOS_KEYS } from "@/lib/hooks";
import { useFetchWalletHumanId } from "@/lib/queries";

function DashboardLink(props: LinkProps) {
  return (
    <NavLink
      py={1.5}
      borderBottom="1px solid transparent"
      _hover={{
        textDecoration: "none",
        color: "green.300",
      }}
      _activeLink={{
        color: "green.500",
        borderBottomColor: "green.500",
      }}
      {...props}
    />
  );
}

export function Component() {
  const { t } = useTranslation();

  const [sessionValue] = useSessionStorage(IDOS_KEYS, "");
  const [storageValue] = useLocalStorage(IDOS_KEYS, "");
  const isAuthorized = !!sessionValue || !!storageValue;

  const humanId = useFetchWalletHumanId({
    enabled: !storageValue,
  });

  if (humanId.isLoading) {
    return <Loading />;
  }

  return (
    <Box>
      {isAuthorized ? (
        <>
          <Flex align="center" gap={6}>
            <DashboardLink to="/">{t("attributes")}</DashboardLink>
            <DashboardLink to="/wallets">{t("wallets")}</DashboardLink>
            <DashboardLink to="/credentials">{t("credentials")}</DashboardLink>
          </Flex>
          <Divider mb={5} />
          <Outlet />
        </>
      ) : null}
    </Box>
  );
}
