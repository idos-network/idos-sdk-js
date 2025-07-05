import { type BadgeProps, chakra, HStack, Spinner, VStack } from "@chakra-ui/react";
import type { IsleStatus } from "@idos-network/core";

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

  if (status === "initializing") {
    return <Spinner w="20px" h="20px" />;
  }

  if (status === "not-connected") {
    return <DisconnectedIcon color="gray" />;
  }

  if (status === "no-profile") {
    return <ProfileIcon color="muted.fg" />;
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

  return <ProfileIcon color="brand" />;
}

const statusBadgeColors: Record<Partial<IsleStatus>, BadgeProps> = {
  initializing: {
    bg: "neutral.500/30",
    color: "neutral.500",
  },
  "no-profile": {
    bg: "neutral.500/30",
    color: "neutral.500",
  },
  "not-verified": {
    bg: "red.400/30",
    color: "red.400",
  },
  "pending-verification": {
    bg: { _dark: "amber.400/30", _light: "amber.400/60" },
    color: { _dark: "amber.400", _light: "amber.500" },
  },
  "pending-permissions": {
    bg: { _dark: "amber.400/30", _light: "amber.400/60" },
    color: { _dark: "amber.400", _light: "amber.500" },
  },
  "not-connected": {
    bg: "neutral.500/30",
    color: "neutral.500",
  },
  verified: {
    bg: {
      _dark: "brand.400/30",
      _light: "brand.200",
    },
    color: {
      _dark: "brand.400",
      _light: "brand.800",
    },
  },
  error: {
    bg: "red.400/30",
    color: "red.400",
  },
};

function StatusBadge() {
  const status = useIsleStore((state) => state.status);
  const badgeProps = statusBadgeColors[status as keyof typeof statusBadgeColors];

  return (
    <Badge {...badgeProps} size="sm" textTransform="uppercase" className="status-badge">
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
