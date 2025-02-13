import { type BadgeProps, HStack, VStack, chakra } from "@chakra-ui/react";

import { DisconnectedIcon } from "@/components/icons/disconnected";
import { ExclamationMarkIcon } from "@/components/icons/exclamation-mark";
import { ProfileIcon } from "@/components/icons/profile";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useIsleStore } from "@/store";

/**
 * @todo: fine-tune the colors
 */
export function ProfileStatusIcon() {
  const status = useIsleStore((state) => state.status);

  if (status === "disconnected") {
    return <DisconnectedIcon color="gray" />;
  }

  if (status === "no-profile") {
    return <ProfileIcon color="gray" />;
  }

  if (status === "not-verified") {
    return <ProfileIcon color="red" />;
  }

  if (status === "pending-verification") {
    return <ProfileIcon color="yellow.500" />;
  }

  if (status === "error") {
    return <ExclamationMarkIcon color="red" />;
  }

  return <ProfileIcon color="aquamarine" />;
}

const badgePropsSrc: Record<string, BadgeProps> = {
  verified: {
    bg: {
      _dark: "aquamarine.400/30",
      _light: "aquamarine.200",
    },
    color: {
      _dark: "aquamarine.400",
      _light: "aquamarine.800",
    },
  },
  "pending-verification": {
    bg: { _dark: "amber.400/30", _light: "amber.400/60" },
    color: { _dark: "amber.400", _light: "amber.500" },
  },
  "no-profile": {
    bg: "neutral.500/30",
    color: "neutral.500",
  },
  disconnected: {
    bg: "neutral.500/30",
    color: "neutral.500",
  },
  error: {
    bg: "red.400/30",
    color: "red.400",
  },
};

function StatusBadge() {
  const status = useIsleStore((state) => state.status);
  const badgeProps = badgePropsSrc[status];
  return (
    <Badge {...badgeProps} size="sm" textTransform="uppercase">
      {status.split("-").join(" ")}
    </Badge>
  );
}
export function Header() {
  return (
    <chakra.header
      display={"flex"}
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
          <StatusBadge />
        </VStack>
      </HStack>
      <ProfileStatusIcon />
    </chakra.header>
  );
}
