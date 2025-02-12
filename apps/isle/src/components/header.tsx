import { type BadgeProps, HStack, VStack, chakra } from "@chakra-ui/react";
import { useAtomValue } from "jotai";

import { statusAtom } from "@/atoms/account";

import { DisconnectedIcon } from "./icons/disconnected";
import { ProfileIcon } from "./icons/profile";
import { Logo } from "./logo";
import { Badge } from "./ui/badge";

/**
 * @todo: fine-tune the colors
 */
function ProfileStatusIcon() {
  const status = useAtomValue(statusAtom);

  if (status === "disconnected") {
    return <DisconnectedIcon color="gray" />;
  }

  if (status === "no profile") {
    return <ProfileIcon color="gray" />;
  }

  if (status === "not verified") {
    return <ProfileIcon color="red" />;
  }

  if (status === "pending verification") {
    return <ProfileIcon color="yellow.500" />;
  }

  return <ProfileIcon color="aquamarine" />;
}

const badgePropsSrc: Record<string, BadgeProps> = {
  verified: {
    bg: "aquamarine.900",
    color: "aquamarine.400",
  },
  "pending verification": {
    bg: "yellow.500",
    color: "white",
  },
  "no profile": {
    bg: "red.500",
    color: "white",
  },
  disconnected: {
    bg: "gray.500",
    color: "white",
  },
};

export function Header() {
  const status = useAtomValue(statusAtom);
  const badgeProps = badgePropsSrc[status];

  return (
    <chakra.header
      display={{ base: "none", sm: "flex" }}
      id="header"
      alignItems="start"
      justifyContent="space-between"
      gap="5"
    >
      <HStack gap="2">
        <Logo />
        <VStack alignItems="flex-start" gap="1">
          <chakra.span fontSize="lg" fontWeight="semibold">
            idOS
          </chakra.span>
          <Badge {...badgeProps} size="sm" textTransform="uppercase">
            {status}
          </Badge>
        </VStack>
      </HStack>
      <ProfileStatusIcon />
    </chakra.header>
  );
}
