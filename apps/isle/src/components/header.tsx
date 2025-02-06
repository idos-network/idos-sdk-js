import type { BadgeProps } from "@chakra-ui/react";
import { chakra } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { Logo } from "./logo";
import { Badge } from "./ui/badge";

export function Header({ icon, badgeProps }: { icon: ReactNode; badgeProps: BadgeProps }) {
  return (
    <>
      <chakra.header
        id="mini-header"
        display={{ sm: "none", smDown: "flex" }}
        w="full"
        alignItems="center"
        justifyContent="space-between"
      >
        <Logo />
        {icon}
      </chakra.header>

      <chakra.header
        display={{ smDown: "none", sm: "flex" }}
        id="full-header"
        w="full"
        alignItems="center"
        justifyContent="space-between"
      >
        <chakra.div display="flex" alignItems="center" w="fit-content">
          <Logo />
          <chakra.div ml={2} display="flex" flexDir="column">
            <chakra.span fontWeight="medium" fontSize="sm">
              idOS
            </chakra.span>
            <Badge {...badgeProps} />
          </chakra.div>
        </chakra.div>
        <chakra.div>{icon}</chakra.div>
      </chakra.header>
    </>
  );
}
