import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps
} from "@chakra-ui/react";
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
  NavLink as RouterNavLink
} from "react-router-dom";

export type LinkProps = ChakraLinkProps & RouterLinkProps;

export function Link(props: LinkProps) {
  return <ChakraLink as={RouterLink} {...props} />;
}

export function NavLink(props: LinkProps) {
  return (
    <ChakraLink
      as={RouterNavLink}
      fontWeight="semibold"
      _activeLink={{
        color: "green.500"
      }}
      textUnderlineOffset={5}
      {...props}
    />
  );
}
